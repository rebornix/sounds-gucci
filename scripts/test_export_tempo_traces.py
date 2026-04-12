"""Tests for export-tempo-traces.py."""

from __future__ import annotations

import importlib.util
import json
import os
import sys
import unittest
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from unittest.mock import patch

# Import the module from its file path (it has dashes in the name).
_spec = importlib.util.spec_from_file_location(
    "export_tempo_traces",
    Path(__file__).with_name("export-tempo-traces.py"),
)
ett = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ett)


# ---------------------------------------------------------------------------
# Helpers to build fake span dicts
# ---------------------------------------------------------------------------

def _span(
    span_id: str,
    name: str = "span",
    parent: str | None = None,
    attrs: dict[str, str] | None = None,
    start_ns: int | None = None,
    end_ns: int | None = None,
) -> dict[str, Any]:
    """Build a minimal span dict matching Tempo's format."""
    span: dict[str, Any] = {
        "traceId": "aaa",
        "spanId": span_id,
        "name": name,
    }
    if parent is not None:
        span["parentSpanId"] = parent
    if start_ns is not None:
        span["startTimeUnixNano"] = str(start_ns)
    if end_ns is not None:
        span["endTimeUnixNano"] = str(end_ns)
    if attrs:
        span["attributes"] = [
            {"key": k, "value": {"stringValue": v}} for k, v in attrs.items()
        ]
    else:
        span["attributes"] = []
    return span


# ---------------------------------------------------------------------------
# Unit tests
# ---------------------------------------------------------------------------


class TestAttrMap(unittest.TestCase):
    def test_extracts_string_values(self):
        span = _span("s1", attrs={"a": "1", "b": "2"})
        result = ett.attr_map(span)
        self.assertEqual(result, {"a": "1", "b": "2"})

    def test_empty_attributes(self):
        span = _span("s1")
        self.assertEqual(ett.attr_map(span), {})

    def test_skips_entries_without_key(self):
        span = _span("s1")
        span["attributes"] = [{"key": "", "value": {"stringValue": "x"}}]
        self.assertEqual(ett.attr_map(span), {})


class TestFlattenSpans(unittest.TestCase):
    def test_flat_list(self):
        spans = [_span("s1"), _span("s2")]
        out: list = []
        ett.flatten_spans(spans, out)
        self.assertEqual(len(out), 2)

    def test_nested_dict(self):
        data = {
            "batches": [
                {
                    "scopeSpans": [
                        {"spans": [_span("s1")]},
                    ]
                }
            ]
        }
        out: list = []
        ett.flatten_spans(data, out)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["spanId"], "s1")

    def test_no_spans(self):
        out: list = []
        ett.flatten_spans({"foo": "bar"}, out)
        self.assertEqual(out, [])


class TestTrimText(unittest.TestCase):
    def test_none(self):
        self.assertIsNone(ett.trim_text(None))

    def test_empty(self):
        self.assertIsNone(ett.trim_text(""))

    def test_short(self):
        self.assertEqual(ett.trim_text("hello"), "hello")

    def test_long(self):
        long = "x" * (ett.TEXT_PREVIEW_LIMIT + 100)
        result = ett.trim_text(long)
        self.assertEqual(len(result), ett.TEXT_PREVIEW_LIMIT)


class TestIsoHelpers(unittest.TestCase):
    def test_iso_from_seconds(self):
        # 2026-01-01T00:00:00Z
        ts = int(datetime(2026, 1, 1, tzinfo=UTC).timestamp())
        result = ett.iso_from_seconds(ts)
        self.assertIn("2026-01-01", result)
        self.assertTrue(result.endswith("Z"))

    def test_iso_from_nanos_none(self):
        self.assertIsNone(ett.iso_from_nanos(None))
        self.assertIsNone(ett.iso_from_nanos(""))

    def test_iso_from_nanos_valid(self):
        # 1 second in nanos
        result = ett.iso_from_nanos(1_000_000_000)
        self.assertIsNotNone(result)
        self.assertTrue(result.endswith("Z"))

    def test_seconds_from_nanos_none(self):
        self.assertIsNone(ett.seconds_from_nanos(None))
        self.assertIsNone(ett.seconds_from_nanos(""))

    def test_seconds_from_nanos_valid(self):
        self.assertAlmostEqual(ett.seconds_from_nanos(2_000_000_000), 2.0)


class TestNormalizeSpanName(unittest.TestCase):
    def test_agent_name(self):
        span = _span("s1", name="invoke_agent")
        attrs = {"gen_ai.agent.name": "bug-analyzer"}
        self.assertEqual(ett.normalize_span_name(span, attrs), "subagent:bug-analyzer")

    def test_tool_name(self):
        span = _span("s1", name="execute_tool")
        attrs = {"gen_ai.tool.name": "grep_search"}
        self.assertEqual(ett.normalize_span_name(span, attrs), "tool:grep_search")

    def test_fallback_to_span_name(self):
        span = _span("s1", name="chat gpt-5.4")
        self.assertEqual(ett.normalize_span_name(span, {}), "chat gpt-5.4")

    def test_fallback_to_operation(self):
        span = _span("s1", name="")
        attrs = {"gen_ai.operation.name": "chat"}
        self.assertEqual(ett.normalize_span_name(span, attrs), "chat")

    def test_fallback_to_span(self):
        span = _span("s1", name="")
        self.assertEqual(ett.normalize_span_name(span, {}), "span")


class TestParseToolArguments(unittest.TestCase):
    def test_valid_json(self):
        result = ett.parse_tool_arguments({"gen_ai.tool.call.arguments": '{"prompt": "hello"}'})
        self.assertEqual(result, {"prompt": "hello"})

    def test_invalid_json(self):
        result = ett.parse_tool_arguments({"gen_ai.tool.call.arguments": "not json"})
        self.assertIsNone(result)

    def test_missing(self):
        result = ett.parse_tool_arguments({})
        self.assertIsNone(result)


class TestBuildQuery(unittest.TestCase):
    def test_contains_all_fields(self):
        query = ett.build_query("12345")
        for field in ett.TEXT_FIELDS:
            self.assertIn(field, query)
        self.assertIn("12345", query)


class TestClassifyTraceForAnalysis(unittest.TestCase):
    def test_direct_with_subagent(self):
        """Trace with a runSubagent span mentioning the analysis -> direct."""
        spans = [
            _span("s1", name="execute_tool runSubagent", attrs={
                "gen_ai.tool.name": "runSubagent",
                "gen_ai.tool.call.arguments": '{"prompt": "data/analysis/99999"}',
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertEqual(ett.classify_trace_for_analysis(spans, attrs_by_id, "99999"), "direct")

    def test_direct_with_agent_name(self):
        """Trace with a bug-analyzer agent span mentioning the analysis -> direct."""
        spans = [
            _span("s1", name="invoke_agent bug-analyzer", attrs={
                "gen_ai.agent.name": "bug-analyzer",
                "gen_ai.input.messages": "data/analysis/99999/issue.md",
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertEqual(ett.classify_trace_for_analysis(spans, attrs_by_id, "99999"), "direct")

    def test_parent_reference_only(self):
        """Trace that references analysis in run_in_terminal args but no subagent -> parent."""
        spans = [
            _span("s1", name="execute_tool run_in_terminal", attrs={
                "gen_ai.tool.name": "run_in_terminal",
                "gen_ai.tool.call.arguments": '{"command": "cd data/analysis/99999"}',
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertEqual(ett.classify_trace_for_analysis(spans, attrs_by_id, "99999"), "parent")

    def test_no_reference(self):
        """Trace with no mention of the analysis -> None."""
        spans = [
            _span("s1", name="chat gpt-5.4", attrs={
                "gen_ai.input.messages": "hello world",
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertIsNone(ett.classify_trace_for_analysis(spans, attrs_by_id, "99999"))

    def test_direct_hint_in_span_name(self):
        """Span name contains 'bug-analyzer' keyword."""
        spans = [
            _span("s1", name="bug-analyzer run", attrs={
                "gen_ai.tool.call.arguments": "data/analysis/99999",
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertEqual(ett.classify_trace_for_analysis(spans, attrs_by_id, "99999"), "direct")

    def test_does_not_match_substring_id(self):
        """Analysis ID 9999 should not match 99999."""
        spans = [
            _span("s1", name="span", attrs={
                "gen_ai.tool.call.arguments": "data/analysis/99999/foo",
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertIsNone(ett.classify_trace_for_analysis(spans, attrs_by_id, "9999"))

    def test_direct_requires_both_hint_and_reference(self):
        """runSubagent span without analysis reference -> None (not direct)."""
        spans = [
            _span("s1", name="execute_tool runSubagent", attrs={
                "gen_ai.tool.name": "runSubagent",
                "gen_ai.tool.call.arguments": '{"prompt": "something else"}',
            }),
        ]
        attrs_by_id = {s["spanId"]: ett.attr_map(s) for s in spans}
        self.assertIsNone(ett.classify_trace_for_analysis(spans, attrs_by_id, "99999"))


class TestDetectPhase(unittest.TestCase):
    def test_proposal_from_agent_name(self):
        spans = [_span("s1", attrs={"gen_ai.agent.name": "bug-analyzer"})]
        attrs_by_id = {"s1": ett.attr_map(spans[0])}
        self.assertEqual(ett.detect_phase(spans, attrs_by_id), "proposal")

    def test_validation_from_agent_name(self):
        spans = [_span("s1", attrs={"gen_ai.agent.name": "fix-validator"})]
        attrs_by_id = {"s1": ett.attr_map(spans[0])}
        self.assertEqual(ett.detect_phase(spans, attrs_by_id), "validation")

    def test_proposal_from_span_name(self):
        spans = [_span("s1", name="invoke_agent bug-analyzer")]
        attrs_by_id = {"s1": ett.attr_map(spans[0])}
        self.assertEqual(ett.detect_phase(spans, attrs_by_id), "proposal")

    def test_validation_from_span_name(self):
        spans = [_span("s1", name="invoke_agent fix-validator")]
        attrs_by_id = {"s1": ett.attr_map(spans[0])}
        self.assertEqual(ett.detect_phase(spans, attrs_by_id), "validation")

    def test_none_when_no_agent(self):
        spans = [_span("s1", name="chat", attrs={"gen_ai.operation.name": "chat"})]
        attrs_by_id = {"s1": ett.attr_map(spans[0])}
        self.assertIsNone(ett.detect_phase(spans, attrs_by_id))


class TestBuildBundleForTrace(unittest.TestCase):
    def test_direct_bundle(self):
        """Direct trace produces a bundle with kind='direct' and phase='proposal'."""
        trace_data = [
            _span("root", name="chat", start_ns=1000, end_ns=2000),
            _span("s1", name="invoke_agent", parent="root",
                  attrs={
                      "gen_ai.agent.name": "bug-analyzer",
                      "gen_ai.input.messages": "data/analysis/12345",
                  },
                  start_ns=1100, end_ns=1900),
        ]
        bundle = ett.build_bundle_for_trace("t1", trace_data, "12345")
        self.assertIsNotNone(bundle)
        self.assertEqual(bundle["kind"], "direct")
        self.assertEqual(bundle["phase"], "proposal")
        self.assertEqual(bundle["traceId"], "t1")
        # Should include s1 (matching) and root (ancestor)
        span_ids = {s["spanId"] for s in bundle["spans"]}
        self.assertIn("s1", span_ids)
        self.assertIn("root", span_ids)

    def test_parent_bundle(self):
        """Parent trace (no subagent) produces kind='parent'."""
        trace_data = [
            _span("root", name="chat", start_ns=1000, end_ns=2000),
            _span("s1", name="execute_tool", parent="root",
                  attrs={
                      "gen_ai.tool.name": "run_in_terminal",
                      "gen_ai.tool.call.arguments": "data/analysis/12345",
                  },
                  start_ns=1100, end_ns=1900),
        ]
        bundle = ett.build_bundle_for_trace("t2", trace_data, "12345")
        self.assertIsNotNone(bundle)
        self.assertEqual(bundle["kind"], "parent")

    def test_no_match_returns_none(self):
        trace_data = [
            _span("root", name="chat", start_ns=1000, end_ns=2000),
        ]
        bundle = ett.build_bundle_for_trace("t3", trace_data, "12345")
        self.assertIsNone(bundle)

    def test_empty_trace(self):
        bundle = ett.build_bundle_for_trace("t4", {}, "12345")
        self.assertIsNone(bundle)


class TestNormalizeTrace(unittest.TestCase):
    def test_basic_structure(self):
        bundle = {
            "traceId": "abc123",
            "kind": "direct",
            "phase": "proposal",
            "spans": [
                _span("s1", name="invoke_agent", attrs={
                    "gen_ai.agent.name": "bug-analyzer",
                    "copilot_chat.session_id": "sess-1",
                }, start_ns=1_000_000_000_000, end_ns=2_000_000_000_000),
            ],
            "attrsById": {
                "s1": ett.attr_map(_span("s1", attrs={
                    "gen_ai.agent.name": "bug-analyzer",
                    "copilot_chat.session_id": "sess-1",
                })),
            },
        }
        result = ett.normalize_trace("12345", "gpt-5.4-2026-04-11", [bundle])
        self.assertEqual(result["traceId"], "tempo:12345:gpt-5.4-2026-04-11")
        self.assertEqual(result["name"], "analysis:12345")
        self.assertIn("tempo", result["tags"])
        self.assertIn("tempo-direct", result["tags"])
        self.assertEqual(result["sessionId"], "sess-1")
        # Root span + group span + 1 data span = 3 spans
        self.assertEqual(len(result["spans"]), 3)
        # Root span uses OTEL-native field names
        root = result["spans"][0]
        self.assertIsNone(root["parentSpanId"])
        self.assertEqual(root["name"], "analysis:12345")
        self.assertIn("spanId", root)
        self.assertIn("startTimeUnixNano", root)
        self.assertIn("attributes", root)
        # Group span has phase label
        group = result["spans"][1]
        self.assertEqual(group["name"], "session:proposal")
        group_attrs = ett.attr_map(group)
        self.assertEqual(group_attrs.get("analysis.phase"), "proposal")
        # Data span preserves original OTEL attributes
        data_span = result["spans"][2]
        self.assertEqual(data_span["spanId"], "s1")
        self.assertIn("attributes", data_span)
        self.assertIn("startTimeUnixNano", data_span)


class TestBuildTraceMetadata(unittest.TestCase):
    def test_available_status(self):
        bundles = [{"kind": "direct", "traceId": "t1", "phase": "proposal"}]
        trace_payload = {"spans": [1, 2, 3]}
        meta = ett.build_trace_metadata("12345", "exp-1", (1000, 2000), bundles, trace_payload)
        self.assertEqual(meta["status"], "available")
        self.assertEqual(meta["source"]["kind"], "tempo-direct")
        self.assertEqual(meta["spanCount"], 3)
        self.assertEqual(meta["phases"], ["proposal"])

    def test_partial_status(self):
        bundles = [{"kind": "parent", "traceId": "t1", "phase": None}]
        trace_payload = {"spans": [1]}
        meta = ett.build_trace_metadata("12345", "exp-1", (1000, 2000), bundles, trace_payload)
        self.assertEqual(meta["status"], "partial")
        self.assertEqual(meta["source"]["kind"], "tempo-parent")
        self.assertEqual(meta["phases"], [])

    def test_missing_status(self):
        meta = ett.build_trace_metadata("12345", "exp-1", (1000, 2000), [], None)
        self.assertEqual(meta["status"], "missing")
        self.assertEqual(meta["source"]["kind"], "missing")
        self.assertEqual(meta["spanCount"], 0)

    def test_no_window(self):
        meta = ett.build_trace_metadata("12345", "exp-1", None, [], None)
        self.assertIsNone(meta["window"]["start"])
        self.assertEqual(meta["fallbackWindows"], [])


class TestGetDayWindows(unittest.TestCase):
    def test_single_day(self):
        # Window within one UTC day
        day_start = int(datetime(2026, 4, 11, 10, 0, tzinfo=UTC).timestamp())
        day_end = int(datetime(2026, 4, 11, 15, 0, tzinfo=UTC).timestamp())
        windows = ett.get_day_windows((day_start, day_end), UTC)
        self.assertEqual(len(windows), 1)
        # Should be midnight to midnight
        expected_start = int(datetime(2026, 4, 11, 0, 0, tzinfo=UTC).timestamp())
        expected_end = int(datetime(2026, 4, 12, 0, 0, tzinfo=UTC).timestamp()) - 1
        self.assertEqual(windows[0], (expected_start, expected_end))

    def test_cross_day(self):
        # Window spanning two UTC days
        day_start = int(datetime(2026, 4, 11, 23, 0, tzinfo=UTC).timestamp())
        day_end = int(datetime(2026, 4, 12, 2, 0, tzinfo=UTC).timestamp())
        windows = ett.get_day_windows((day_start, day_end), UTC)
        self.assertEqual(len(windows), 2)


class TestGetFallbackWindows(unittest.TestCase):
    def test_deduplicates(self):
        ts = int(datetime(2026, 4, 11, 12, 0, tzinfo=UTC).timestamp())
        window = (ts, ts + 100)
        windows = ett.get_fallback_windows(window)
        # Should have no duplicates
        self.assertEqual(len(windows), len(set(windows)))
        # Should have at least 1 window
        self.assertGreaterEqual(len(windows), 1)


class TestFindTargets(unittest.TestCase):
    def test_finds_matching_targets(self, tmp_path=None):
        """find_targets returns directories matching experiment + tags."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            analysis_dir = root / "data" / "analysis" / "12345"
            exp_dir = analysis_dir / "gpt-5.4-2026-04-11"
            exp_dir.mkdir(parents=True)
            (analysis_dir / "metadata.json").write_text(json.dumps({
                "tags": ["round-2", "2026-03", "bug"],
            }))
            (exp_dir / "proposed-fix.md").write_text("fix")

            targets = ett.find_targets(root, "gpt-5.4-2026-04-11", None, False)
            self.assertEqual(len(targets), 1)
            self.assertEqual(targets[0][0].name, "12345")

    def test_skips_wrong_tags(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            analysis_dir = root / "data" / "analysis" / "12345"
            exp_dir = analysis_dir / "gpt-5.4-2026-04-11"
            exp_dir.mkdir(parents=True)
            (analysis_dir / "metadata.json").write_text(json.dumps({
                "tags": ["other"],
            }))
            (exp_dir / "proposed-fix.md").write_text("fix")

            targets = ett.find_targets(root, "gpt-5.4-2026-04-11", None, False)
            self.assertEqual(len(targets), 0)

    def test_all_tags_flag(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            analysis_dir = root / "data" / "analysis" / "12345"
            exp_dir = analysis_dir / "gpt-5.4-2026-04-11"
            exp_dir.mkdir(parents=True)
            (analysis_dir / "metadata.json").write_text(json.dumps({
                "tags": ["other"],
            }))
            (exp_dir / "proposed-fix.md").write_text("fix")

            targets = ett.find_targets(root, "gpt-5.4-2026-04-11", None, True)
            self.assertEqual(len(targets), 1)


class TestGetRunWindow(unittest.TestCase):
    def test_returns_none_for_empty_dir(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            self.assertIsNone(ett.get_run_window(Path(tmp)))

    def test_returns_window_with_padding(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "proposed-fix.md"
            p.write_text("fix")
            window = ett.get_run_window(Path(tmp))
            self.assertIsNotNone(window)
            mtime = int(p.stat().st_mtime)
            self.assertEqual(window[0], mtime - ett.WINDOW_PADDING_SECONDS)
            self.assertEqual(window[1], mtime + ett.WINDOW_PADDING_SECONDS)


class TestSpanText(unittest.TestCase):
    def test_includes_name_and_attrs(self):
        span = _span("s1", name="my-span")
        attrs = {"key1": "val1", "key2": "val2"}
        text = ett.span_text(span, attrs)
        self.assertIn("my-span", text)
        self.assertIn("key1", text)
        self.assertIn("val1", text)


if __name__ == "__main__":
    unittest.main()
