#!/usr/bin/env python3
"""Export per-analysis Tempo traces into local trace.json files.

This script reconstructs renderable traces for experiment directories by:
1. Deriving a time window from proposal/validation file mtimes.
2. Searching Tempo for traces that mention the analysis directory.
3. Filtering those traces down to subagent-relevant spans.
4. Writing a normalized trace.json plus trace-metadata.json.

By default this targets the March round-two gpt-5.4 run.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


DEFAULT_EXPERIMENT = "gpt-5.4-2026-04-11"
DEFAULT_TEMPO_API = os.environ.get(
    "TEMPO_API_URL",
    "http://localhost:3000/api/datasources/proxy/uid/tempo/api",
)
MARCH_TAGS = {"round-2", "2026-03", "bug"}
TEXT_FIELDS = (
    "gen_ai.tool.call.arguments",
    "gen_ai.tool.call.result",
    "gen_ai.input.messages",
    "gen_ai.output.messages",
)
DIRECT_AGENTS = {"bug-analyzer", "fix-validator"}
WINDOW_PADDING_SECONDS = 300
TEXT_PREVIEW_LIMIT = 12000
LOCAL_TZ = datetime.now().astimezone().tzinfo or UTC
SEARCH_CACHE: dict[tuple[str, int, int, str | None, int], list[dict[str, Any]]] = {}
TRACE_CACHE: dict[tuple[str, str], dict[str, Any]] = {}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--experiment",
        default=DEFAULT_EXPERIMENT,
        help=f"Experiment directory to export (default: {DEFAULT_EXPERIMENT})",
    )
    parser.add_argument(
        "--analysis",
        help="Only export one analysis directory by numeric id",
    )
    parser.add_argument(
        "--all-tags",
        action="store_true",
        help="Ignore the default March tag filter and process any matching experiment",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing trace.json files",
    )
    parser.add_argument(
        "--tempo-api",
        default=DEFAULT_TEMPO_API,
        help=f"Tempo API base URL (default: {DEFAULT_TEMPO_API})",
    )
    return parser.parse_args()


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def iso_from_seconds(timestamp: int) -> str:
    return datetime.fromtimestamp(timestamp, UTC).isoformat().replace("+00:00", "Z")


def iso_from_seconds_local(timestamp: int) -> str:
    return datetime.fromtimestamp(timestamp, LOCAL_TZ).isoformat()


def iso_from_nanos(timestamp: str | int | None) -> str | None:
    if timestamp in (None, ""):
        return None
    return datetime.fromtimestamp(int(timestamp) / 1_000_000_000, UTC).isoformat().replace("+00:00", "Z")


def seconds_from_nanos(timestamp: str | int | None) -> float | None:
    if timestamp in (None, ""):
        return None
    return int(timestamp) / 1_000_000_000


def fetch_json(url: str) -> Any:
    with urlopen(url) as response:
        return json.load(response)


def tempo_search(base_url: str, start: int, end: int, query: str | None = None, limit: int = 500) -> list[dict[str, Any]]:
    cache_key = (base_url, start, end, query, limit)
    cached = SEARCH_CACHE.get(cache_key)
    if cached is not None:
        return cached
    params = {
        "limit": str(limit),
        "start": str(start),
        "end": str(end),
    }
    if query:
        params["query"] = query
    url = f"{base_url}/search?{urlencode(params)}"
    data = fetch_json(url)
    traces = data.get("traces", [])
    SEARCH_CACHE[cache_key] = traces
    return traces


def fetch_trace(base_url: str, trace_id: str) -> dict[str, Any]:
    cache_key = (base_url, trace_id)
    cached = TRACE_CACHE.get(cache_key)
    if cached is not None:
        return cached
    payload = fetch_json(f"{base_url}/traces/{trace_id}")
    TRACE_CACHE[cache_key] = payload
    return payload


def flatten_spans(node: Any, out: list[dict[str, Any]]) -> None:
    if isinstance(node, dict):
        if {"traceId", "spanId", "name"}.issubset(node.keys()):
            out.append(node)
        for value in node.values():
            flatten_spans(value, out)
        return
    if isinstance(node, list):
        for item in node:
            flatten_spans(item, out)


def attr_map(span: dict[str, Any]) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for entry in span.get("attributes", []):
        key = entry.get("key")
        value = entry.get("value", {})
        if not key:
            continue
        attrs[key] = str(next(iter(value.values()), ""))
    return attrs


def trim_text(value: str | None) -> str | None:
    if not value:
        return None
    return value[:TEXT_PREVIEW_LIMIT]


def span_text(span: dict[str, Any], attrs: dict[str, str]) -> str:
    pieces = [str(span.get("name", ""))]
    for key, value in attrs.items():
        pieces.append(key)
        pieces.append(str(value))
    return "\n".join(pieces)


def classify_trace_for_analysis(spans: list[dict[str, Any]], attrs_by_id: dict[str, dict[str, str]], analysis_id: str) -> str | None:
    """Classify a trace's relationship to an analysis.

    Returns 'direct' if there are subagent spans (bug-analyzer/fix-validator/runSubagent),
    'parent' if the trace references the analysis in any span text,
    or None if no reference is found.
    """
    pattern = re.compile(rf"data/analysis/{re.escape(analysis_id)}(?:/|\b)")
    has_direct = False
    has_reference = False

    for span in spans:
        attrs = attrs_by_id[span["spanId"]]
        # Check for direct subagent relationship
        if attrs.get("gen_ai.tool.name") == "runSubagent":
            has_direct = True
        if attrs.get("gen_ai.agent.name") in DIRECT_AGENTS:
            has_direct = True
        hint_text = " ".join(
            filter(
                None,
                [
                    span.get("name", ""),
                    attrs.get("copilot_chat.debug_log_label", ""),
                    attrs.get("copilot_chat.mode_name", ""),
                ],
            )
        )
        if any(token in hint_text for token in ("runSubagent", "bug-analyzer", "fix-validator")):
            has_direct = True

        # Check for any text reference to this analysis
        if not has_reference:
            text = span_text(span, attrs)
            if pattern.search(text):
                has_reference = True

    if has_direct and has_reference:
        return "direct"
    if has_reference:
        return "parent"
    return None


def normalize_span_name(span: dict[str, Any], attrs: dict[str, str]) -> str:
    agent_name = attrs.get("gen_ai.agent.name")
    if agent_name:
        return f"subagent:{agent_name}"
    tool_name = attrs.get("gen_ai.tool.name")
    if tool_name:
        return f"tool:{tool_name}"
    return str(span.get("name") or attrs.get("gen_ai.operation.name") or "span")


def parse_tool_arguments(attrs: dict[str, str]) -> dict[str, Any] | None:
    payload = attrs.get("gen_ai.tool.call.arguments")
    if not payload:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def build_query(analysis_id: str) -> str:
    pattern = f".*data/analysis/{analysis_id}.*"
    clauses = [f'{{span.{field} =~ "{pattern}"}}' for field in TEXT_FIELDS]
    return " || ".join(clauses)


def get_run_window(exp_dir: Path) -> tuple[int, int] | None:
    timestamps = []
    for name in ("proposed-fix.md", "validation.md"):
        path = exp_dir / name
        if path.exists():
            timestamps.append(int(path.stat().st_mtime))
    if not timestamps:
        return None
    return min(timestamps) - WINDOW_PADDING_SECONDS, max(timestamps) + WINDOW_PADDING_SECONDS


def get_day_windows(window: tuple[int, int], timezone: Any) -> list[tuple[int, int]]:
    start_of_day = datetime.fromtimestamp(window[0], timezone).replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = datetime.fromtimestamp(window[1], timezone).replace(hour=0, minute=0, second=0, microsecond=0)

    windows: list[tuple[int, int]] = []
    current = start_of_day
    while current <= end_of_day:
        next_day = current + timedelta(days=1)
        windows.append((int(current.timestamp()), int(next_day.timestamp()) - 1))
        current = next_day

    return windows


def get_fallback_windows(window: tuple[int, int]) -> list[tuple[int, int]]:
    windows: list[tuple[int, int]] = []
    seen: set[tuple[int, int]] = set()

    for timezone in (LOCAL_TZ, UTC):
        for day_window in get_day_windows(window, timezone):
            if day_window in seen:
                continue
            seen.add(day_window)
            windows.append(day_window)

    return windows


def build_bundle_for_trace(trace_id: str, trace_data: dict[str, Any], analysis_id: str) -> dict[str, Any] | None:
    spans: list[dict[str, Any]] = []
    flatten_spans(trace_data, spans)
    if not spans:
        return None

    attrs_by_id = {span["spanId"]: attr_map(span) for span in spans}
    kind = classify_trace_for_analysis(spans, attrs_by_id, analysis_id)
    if kind is None:
        return None

    pattern = re.compile(rf"data/analysis/{re.escape(analysis_id)}(?:/|\b)")
    matching_ids: set[str] = set()
    for span in spans:
        attrs = attrs_by_id[span["spanId"]]
        if pattern.search(span_text(span, attrs)):
            matching_ids.add(span["spanId"])

    if not matching_ids:
        return None

    by_id = {span["spanId"]: span for span in spans}
    included_ids = set(matching_ids)
    for span_id in list(matching_ids):
        parent_id = by_id[span_id].get("parentSpanId")
        while parent_id and parent_id in by_id and parent_id not in included_ids:
            included_ids.add(parent_id)
            parent_id = by_id[parent_id].get("parentSpanId")

    included_spans = [span for span in spans if span["spanId"] in included_ids]
    included_spans.sort(key=lambda item: (item.get("startTimeUnixNano") or "", item.get("spanId") or ""))

    return {
        "traceId": trace_id,
        "kind": kind,
        "spans": included_spans,
        "attrsById": {span_id: attrs_by_id[span_id] for span_id in included_ids},
    }


def normalize_trace(analysis_id: str, experiment_id: str, bundles: list[dict[str, Any]]) -> dict[str, Any]:
    """Build a trace envelope around OTEL-native spans.

    Spans are kept in their original Tempo format (spanId, parentSpanId,
    startTimeUnixNano, attributes[]).  Only synthetic root and trace-group
    spans are injected to tie multi-trace bundles together.
    """
    synthetic_root_id = f"analysis:{analysis_id}"
    span_entries: list[dict[str, Any]] = []
    session_ids: set[str] = set()
    tags = {"tempo"}
    start_times: list[float] = []
    end_times: list[float] = []

    for bundle in bundles:
        tags.add(f"tempo-{bundle['kind']}")
        group_spans = bundle["spans"]
        bundle_start = min(filter(None, (seconds_from_nanos(span.get("startTimeUnixNano")) for span in group_spans)), default=None)
        bundle_end = max(filter(None, (seconds_from_nanos(span.get("endTimeUnixNano")) for span in group_spans)), default=bundle_start)
        group_id = f"trace-group:{bundle['traceId']}"
        if bundle_start is not None:
            start_times.append(bundle_start)
        if bundle_end is not None:
            end_times.append(bundle_end or bundle_start)

        first_start = next((span.get("startTimeUnixNano") for span in group_spans if span.get("startTimeUnixNano")), None)
        last_end = next((span.get("endTimeUnixNano") for span in reversed(group_spans) if span.get("endTimeUnixNano")), None)

        # Synthetic group span to anchor this bundle under the root
        span_entries.append(
            {
                "spanId": group_id,
                "parentSpanId": synthetic_root_id,
                "name": f"tempo:{bundle['kind']}:{bundle['traceId'][:12]}",
                "kind": "SPAN",
                "startTimeUnixNano": first_start,
                "endTimeUnixNano": last_end,
                "attributes": [
                    {"key": "synthetic", "value": {"stringValue": "true"}},
                    {"key": "source.traceId", "value": {"stringValue": bundle["traceId"]}},
                    {"key": "source.kind", "value": {"stringValue": bundle["kind"]}},
                ],
            }
        )

        # Collect session IDs for the envelope
        bundle_ids = {span["spanId"] for span in group_spans}
        for span in group_spans:
            attrs = bundle["attrsById"][span["spanId"]]
            session_id = attrs.get("copilot_chat.session_id") or attrs.get("copilot_chat.parent_chat_session_id")
            if session_id:
                session_ids.add(session_id)

            # Re-parent top-level spans to the group span
            parent_span_id = span.get("parentSpanId")
            patched_parent = parent_span_id if parent_span_id in bundle_ids else group_id

            start_seconds = seconds_from_nanos(span.get("startTimeUnixNano"))
            end_seconds = seconds_from_nanos(span.get("endTimeUnixNano"))
            if start_seconds is not None:
                start_times.append(start_seconds)
            if end_seconds is not None:
                end_times.append(end_seconds)

            # Keep the original span, only patch parentSpanId for orphans
            entry = dict(span)
            entry["parentSpanId"] = patched_parent
            span_entries.append(entry)

    overall_start = min(start_times) if start_times else None
    overall_end = max(end_times) if end_times else overall_start
    root_latency = None
    if overall_start is not None and overall_end is not None:
        root_latency = overall_end - overall_start

    root_start_nanos = str(int(overall_start * 1_000_000_000)) if overall_start is not None else None
    root_end_nanos = str(int(overall_end * 1_000_000_000)) if overall_end is not None else None

    # Synthetic root span
    span_entries.insert(
        0,
        {
            "spanId": synthetic_root_id,
            "parentSpanId": None,
            "name": f"analysis:{analysis_id}",
            "kind": "SPAN",
            "startTimeUnixNano": root_start_nanos,
            "endTimeUnixNano": root_end_nanos,
            "attributes": [
                {"key": "synthetic", "value": {"stringValue": "true"}},
                {"key": "analysis.id", "value": {"stringValue": analysis_id}},
                {"key": "analysis.experimentId", "value": {"stringValue": experiment_id}},
                {"key": "source.traceIds", "value": {"stringValue": ",".join(bundle["traceId"] for bundle in bundles)}},
            ],
        },
    )

    return {
        "traceId": f"tempo:{analysis_id}:{experiment_id}",
        "name": f"analysis:{analysis_id}",
        "timestamp": iso_from_nanos(int(overall_start * 1_000_000_000) if overall_start is not None else None),
        "tags": sorted(tags),
        "sessionId": next(iter(sorted(session_ids)), None),
        "latency": root_latency,
        "totalCost": None,
        "spans": span_entries,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def find_targets(repo_root: Path, experiment_id: str, target_analysis: str | None, all_tags: bool) -> list[tuple[Path, Path, dict[str, Any]]]:
    analysis_root = repo_root / "data" / "analysis"
    targets = []
    for analysis_dir in sorted(analysis_root.iterdir()):
        if not analysis_dir.is_dir() or not analysis_dir.name.isdigit():
            continue
        if target_analysis and analysis_dir.name != target_analysis:
            continue
        metadata_path = analysis_dir / "metadata.json"
        if not metadata_path.exists():
            continue
        metadata = json.loads(metadata_path.read_text())
        if not all_tags and not MARCH_TAGS.issubset(set(metadata.get("tags", []))):
            continue
        exp_dir = analysis_dir / experiment_id
        if not exp_dir.is_dir():
            continue
        targets.append((analysis_dir, exp_dir, metadata))
    return targets


def build_trace_metadata(
    analysis_id: str,
    experiment_id: str,
    window: tuple[int, int] | None,
    bundles: list[dict[str, Any]],
    trace_payload: dict[str, Any] | None,
) -> dict[str, Any]:
    fallback_windows = get_fallback_windows(window) if window else []
    if bundles:
        status = "available" if any(bundle["kind"] == "direct" for bundle in bundles) else "partial"
        source_kind = "tempo-direct" if status == "available" else "tempo-parent"
        note = (
            "Rendered from Tempo spans that directly reference this analysis run."
            if status == "available"
            else "Rendered from a parent/root Tempo trace because no direct per-analysis subagent span was available."
        )
    else:
        status = "missing"
        source_kind = "missing"
        note = "No Tempo trace payload matched this analysis directory inside the execution window derived from proposal and validation timestamps."

    return {
        "analysisId": analysis_id,
        "experimentId": experiment_id,
        "status": status,
        "source": {
            "kind": source_kind,
            "traceIds": [bundle["traceId"] for bundle in bundles],
        },
        "generatedAt": now_iso(),
        "window": {
            "start": iso_from_seconds(window[0]) if window else None,
            "end": iso_from_seconds(window[1]) if window else None,
        },
        "windowLocal": {
            "start": iso_from_seconds_local(window[0]) if window else None,
            "end": iso_from_seconds_local(window[1]) if window else None,
        },
        "fallbackWindows": [
            {
                "start": iso_from_seconds(start),
                "end": iso_from_seconds(end),
                "startLocal": iso_from_seconds_local(start),
                "endLocal": iso_from_seconds_local(end),
            }
            for start, end in fallback_windows
        ],
        "traceCount": len(bundles),
        "spanCount": len(trace_payload.get("spans", [])) if trace_payload else 0,
        "note": note,
    }


def process_target(base_url: str, analysis_dir: Path, exp_dir: Path, metadata: dict[str, Any], overwrite: bool) -> dict[str, Any]:
    analysis_id = analysis_dir.name
    experiment_id = exp_dir.name
    trace_path = exp_dir / "trace.json"
    trace_meta_path = exp_dir / "trace-metadata.json"
    window = get_run_window(exp_dir)

    if window is None:
        trace_metadata = build_trace_metadata(analysis_id, experiment_id, None, [], None)
        write_json(trace_meta_path, trace_metadata)
        if overwrite and trace_path.exists():
            trace_path.unlink()
        return trace_metadata

    start, end = window
    def collect_bundles(search_start: int, search_end: int, include_unfiltered: bool) -> list[dict[str, Any]]:
        candidate_ids = {
            trace["traceID"]
            for trace in tempo_search(base_url, search_start, search_end, build_query(analysis_id))
        }
        if include_unfiltered:
            candidate_ids.update(trace["traceID"] for trace in tempo_search(base_url, search_start, search_end))

        bundles: list[dict[str, Any]] = []
        for trace_id in sorted(candidate_ids):
            try:
                trace_data = fetch_trace(base_url, trace_id)
            except (HTTPError, URLError, json.JSONDecodeError):
                continue
            bundle = build_bundle_for_trace(trace_id, trace_data, analysis_id)
            if bundle:
                bundles.append(bundle)
        return bundles

    bundles = collect_bundles(start, end, include_unfiltered=True)
    if not bundles:
        for day_start, day_end in get_fallback_windows(window):
            bundles = collect_bundles(day_start, day_end, include_unfiltered=True)
            if bundles:
                break

    selected_bundles = [bundle for bundle in bundles if bundle["kind"] == "direct"]
    if not selected_bundles:
        selected_bundles = bundles

    trace_payload = normalize_trace(analysis_id, experiment_id, selected_bundles) if selected_bundles else None
    if trace_payload:
        if overwrite or not trace_path.exists():
            write_json(trace_path, trace_payload)
    elif overwrite and trace_path.exists():
        trace_path.unlink()

    trace_metadata = build_trace_metadata(analysis_id, experiment_id, window, selected_bundles, trace_payload)
    write_json(trace_meta_path, trace_metadata)
    return trace_metadata


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parent.parent
    targets = find_targets(repo_root, args.experiment, args.analysis, args.all_tags)
    if not targets:
        print("No matching experiment directories found.")
        return 1

    results: list[dict[str, Any]] = []
    for analysis_dir, exp_dir, metadata in targets:
        trace_metadata = process_target(args.tempo_api, analysis_dir, exp_dir, metadata, args.overwrite)
        results.append(trace_metadata)
        print(
            f"{analysis_dir.name}/{exp_dir.name}: {trace_metadata['status']} "
            f"({trace_metadata['traceCount']} trace(s), {trace_metadata['spanCount']} span(s))"
        )

    status_counts: dict[str, int] = {}
    for result in results:
        status_counts[result["status"]] = status_counts.get(result["status"], 0) + 1

    counts_text = ", ".join(f"{key}={value}" for key, value in sorted(status_counts.items()))
    print(f"Done: {counts_text}")
    return 0


if __name__ == "__main__":
    sys.exit(main())