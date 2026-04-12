#!/usr/bin/env python3
"""Convert legacy trace.json files to OTEL-native span format.

Handles both Tempo-sourced and Langfuse-sourced legacy traces by
reconstructing OTEL attributes from the metadata fields that were
flattened during the original export.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path


def iso_to_nanos(iso_str: str | None) -> str | None:
    if not iso_str:
        return None
    dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    return str(int(dt.timestamp() * 1_000_000_000))


def extract_span_ids(span_id: str) -> str:
    """Extract the original spanId from a prefixed ID like 'traceId:spanId'."""
    if ":" in span_id:
        return span_id.split(":", 1)[1]
    return span_id


def is_synthetic_id(span_id: str) -> bool:
    return span_id.startswith("analysis:") or span_id.startswith("trace-group:")


def convert_span(span: dict, is_tempo: bool) -> dict:
    """Convert a legacy span to OTEL-native format."""
    raw_id = span.get("id", "")
    raw_parent = span.get("parentId")
    meta = span.get("metadata", {})

    # Keep synthetic spans (root, trace-group) but use OTEL field names
    if is_synthetic_id(raw_id):
        attrs = [{"key": "synthetic", "value": {"stringValue": "true"}}]
        if meta.get("analysisId"):
            attrs.append({"key": "analysis.id", "value": {"stringValue": meta["analysisId"]}})
        if meta.get("experimentId"):
            attrs.append({"key": "analysis.experimentId", "value": {"stringValue": meta["experimentId"]}})
        if meta.get("sourceTraceIds"):
            attrs.append({"key": "source.traceIds", "value": {"stringValue": ",".join(meta["sourceTraceIds"])}})
        if meta.get("traceId"):
            attrs.append({"key": "source.traceId", "value": {"stringValue": meta["traceId"]}})
        if meta.get("sourceKind"):
            attrs.append({"key": "source.kind", "value": {"stringValue": meta["sourceKind"]}})

        return {
            "spanId": raw_id,
            "parentSpanId": raw_parent,
            "name": span["name"],
            "kind": span.get("type", "SPAN"),
            "startTimeUnixNano": iso_to_nanos(span.get("startTime")),
            "endTimeUnixNano": iso_to_nanos(span.get("endTime")),
            "attributes": attrs,
        }

    # Data spans: reconstruct OTEL attributes
    attrs = []

    if is_tempo:
        # Tempo legacy: metadata has originalName, agentName, toolName, operation
        if meta.get("agentName"):
            attrs.append({"key": "gen_ai.agent.name", "value": {"stringValue": meta["agentName"]}})
        if meta.get("toolName"):
            attrs.append({"key": "gen_ai.tool.name", "value": {"stringValue": meta["toolName"]}})
        if meta.get("operation"):
            attrs.append({"key": "gen_ai.operation.name", "value": {"stringValue": meta["operation"]}})
    else:
        # Langfuse legacy: infer from normalized name
        name = span.get("name", "")
        if name.startswith("subagent:"):
            attrs.append({"key": "gen_ai.agent.name", "value": {"stringValue": name[9:]}})
        elif name.startswith("tool:"):
            attrs.append({"key": "gen_ai.tool.name", "value": {"stringValue": name[5:]}})
        # Preserve Langfuse-specific metadata
        if meta.get("type"):
            attrs.append({"key": "langfuse.type", "value": {"stringValue": meta["type"]}})
        if meta.get("scope"):
            attrs.append({"key": "langfuse.scope", "value": {"stringValue": meta["scope"]}})

    # Map input/output back to gen_ai attributes
    input_val = span.get("input")
    output_val = span.get("output")
    name = span.get("name", "")

    if input_val:
        if name.startswith("tool:"):
            attrs.append({"key": "gen_ai.tool.call.arguments", "value": {"stringValue": input_val}})
        else:
            attrs.append({"key": "gen_ai.input.messages", "value": {"stringValue": input_val}})

    if output_val:
        if name.startswith("tool:"):
            attrs.append({"key": "gen_ai.tool.call.result", "value": {"stringValue": output_val}})
        else:
            attrs.append({"key": "gen_ai.output.messages", "value": {"stringValue": output_val}})

    # Use the original span name if available, otherwise keep the normalized one
    otel_name = meta.get("originalName") or span.get("name", "span")

    return {
        "spanId": extract_span_ids(raw_id),
        "parentSpanId": extract_span_ids(raw_parent) if raw_parent and not is_synthetic_id(raw_parent) else raw_parent,
        "name": otel_name,
        "kind": span.get("type", "SPAN"),
        "startTimeUnixNano": iso_to_nanos(span.get("startTime")),
        "endTimeUnixNano": iso_to_nanos(span.get("endTime")),
        "attributes": attrs,
    }


def convert_trace(trace: dict) -> dict:
    """Convert an entire legacy trace to OTEL-native format."""
    tags = trace.get("tags", [])
    is_tempo = "tempo" in tags

    converted_spans = [convert_span(s, is_tempo) for s in trace.get("spans", [])]

    return {
        "traceId": trace.get("traceId"),
        "name": trace.get("name"),
        "timestamp": trace.get("timestamp"),
        "tags": tags,
        "sessionId": trace.get("sessionId"),
        "latency": trace.get("latency"),
        "totalCost": trace.get("totalCost"),
        "spans": converted_spans,
    }


def is_legacy(trace: dict) -> bool:
    """Check if a trace is in legacy format (has id/parentId instead of spanId/parentSpanId)."""
    spans = trace.get("spans", [])
    if not spans:
        return False
    return "id" in spans[0] and "spanId" not in spans[0]


def main():
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--analysis", help="Only convert a specific PR directory")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be converted without writing")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    analysis_dir = repo_root / "data" / "analysis"

    converted = 0
    skipped = 0

    for pr_dir in sorted(analysis_dir.iterdir()):
        if not pr_dir.is_dir() or not pr_dir.name.isdigit():
            continue
        if args.analysis and pr_dir.name != args.analysis:
            continue

        for exp_dir in sorted(pr_dir.iterdir()):
            if not exp_dir.is_dir() or exp_dir.name == "actual_fix":
                continue

            trace_path = exp_dir / "trace.json"
            if not trace_path.exists():
                continue

            with open(trace_path) as f:
                trace = json.load(f)

            if not is_legacy(trace):
                skipped += 1
                continue

            new_trace = convert_trace(trace)

            if args.dry_run:
                print(f"  Would convert: {pr_dir.name}/{exp_dir.name} ({len(trace['spans'])} spans)")
            else:
                trace_path.write_text(json.dumps(new_trace, indent=2) + "\n")
                print(f"  Converted: {pr_dir.name}/{exp_dir.name} ({len(trace['spans'])} spans)")

            converted += 1

    print(f"\n{'Would convert' if args.dry_run else 'Converted'}: {converted}, Skipped (already native): {skipped}")


if __name__ == "__main__":
    main()
