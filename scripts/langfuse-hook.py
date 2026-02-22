#!/usr/bin/env python3
"""
Langfuse hook for Copilot CLI.

Captures conversation transcripts from sessionEnd hooks
and sends them to Langfuse as traces with full tool call details.

Supports per-prompt tracing: if user messages contain [trace:pr-XXXXX] tags,
each tagged prompt gets its own Langfuse trace with trace URL saved to
the corresponding PR's metadata.json.

Required environment variables (set in .env):
  LANGFUSE_PUBLIC_KEY  - Your Langfuse public key
  LANGFUSE_SECRET_KEY  - Your Langfuse secret key
  LANGFUSE_BASE_URL    - Langfuse host (default: https://cloud.langfuse.com)
  LANGFUSE_ENABLED     - Set to "true" to enable tracing

Optional:
  LANGFUSE_DEBUG       - Set to "true" for verbose logging
"""

import json
import hashlib
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def _parse_ts(ts_str):
    """Parse ISO timestamp string to epoch milliseconds for Langfuse."""
    if not ts_str:
        return None
    try:
        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        return int(dt.timestamp() * 1000)
    except (ValueError, TypeError):
        return None


def load_dotenv():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    value = value.strip().strip('"').strip("'")
                    os.environ.setdefault(key.strip(), value)


load_dotenv()

if os.environ.get("LANGFUSE_ENABLED", "").lower() != "true":
    sys.exit(0)

DEBUG = os.environ.get("LANGFUSE_DEBUG", "").lower() == "true"
LOG_FILE = Path.home() / ".langfuse-hook.log"


def log(msg: str):
    if DEBUG:
        with open(LOG_FILE, "a") as f:
            f.write(f"[{datetime.now().isoformat()}] {msg}\n")


def split_events_by_prompt(events):
    """Split events into segments, one per user.message (fallback)."""
    segments = []
    current = []
    for event in events:
        if event.get("type") == "user.message" and current:
            segments.append(current)
            current = []
        current.append(event)
    if current:
        segments.append(current)
    return segments


def split_events_by_pr(events):
    """Split events into per-PR groups based on subagent task calls.
    
    Groups consecutive events between PR-related subagent calls.
    Falls back to splitting by user.message if no task calls found.
    """
    # First, find all task tool calls and extract PR numbers
    pr_segments = {}  # pr_number -> list of event indices
    current_pr = None
    current_start = 0
    
    # Scan for task tool calls to identify PR boundaries
    task_ranges = []  # (start_idx, end_idx, pr_number)
    for i, event in enumerate(events):
        if event.get("type") in ("tool.execution_start", "tool.start"):
            data = event.get("data", {})
            if data.get("toolName") == "task":
                args = data.get("arguments", {})
                prompt = args.get("prompt", "")
                m = re.search(r'data/analysis/(\d+)', prompt)
                if m:
                    pr = m.group(1)
                    # Find the matching execution_complete
                    end_idx = i
                    tool_call_id = data.get("toolCallId")
                    for j in range(i + 1, len(events)):
                        if (events[j].get("type") in ("tool.execution_complete", "tool.complete")
                                and events[j].get("data", {}).get("toolCallId") == tool_call_id):
                            end_idx = j
                            break
                    task_ranges.append((i, end_idx, pr))
    
    if not task_ranges:
        # No subagent task calls found — fall back to per-user-message splitting
        return split_events_by_prompt(events)
    
    # Group task ranges by PR number, maintaining order
    pr_groups = {}  # pr_number -> [(start, end), ...]
    pr_order = []
    for start, end, pr in task_ranges:
        if pr not in pr_groups:
            pr_groups[pr] = []
            pr_order.append(pr)
        pr_groups[pr].append((start, end))
    
    # Build segments: for each PR, collect all events in its task ranges
    # plus surrounding assistant messages
    segments = []
    for pr in pr_order:
        ranges = pr_groups[pr]
        # Expand range to include surrounding assistant messages
        first_start = ranges[0][0]
        last_end = ranges[-1][1]
        
        # Look back for the assistant.message that triggered the first task
        seg_start = first_start
        for k in range(first_start - 1, -1, -1):
            if events[k].get("type") == "assistant.message":
                seg_start = k
                break
            if events[k].get("type") == "user.message":
                seg_start = k
                break
        
        segment_events = events[seg_start:last_end + 1]
        segments.append((pr, segment_events))
    
    return segments


def parse_trace_tag(content):
    """Extract PR number from [trace:pr-XXXXX] tag in message."""
    match = re.search(r'\[trace:pr-(\d+)\]', content)
    return match.group(1) if match else None


def process_segment(langfuse, segment, session_id, cwd, segment_index, pr_number=None):
    """Create a Langfuse trace for one prompt segment."""
    # Find user message and extract PR number if not provided
    user_content = ""
    for event in segment:
        if event.get("type") == "user.message":
            user_content = event.get("data", {}).get("content", "")
            if not pr_number:
                pr_number = parse_trace_tag(user_content)
            if not pr_number:
                m = re.search(r'data/analysis/(\d+)', user_content)
                pr_number = m.group(1) if m else None
            break

    project_name = Path(cwd).name if cwd else "unknown"
    if pr_number:
        trace_name = f"{project_name}/pr-{pr_number}"
    else:
        trace_name = f"{project_name}/prompt-{segment_index}"

    # Deterministic trace ID: one trace per PR per model experiment
    # Re-sends from the same or different sessions overwrite instead of duplicating
    model_name = ""
    model_file = Path(cwd) / ".model" if cwd else None
    if model_file and model_file.exists():
        model_name = model_file.read_text().strip()
    trace_key = f"{pr_number or segment_index}:{model_name}"
    det_trace_id = hashlib.md5(trace_key.encode()).hexdigest()

    root = langfuse.start_span(
        name=trace_name,
        trace_context={"trace_id": det_trace_id},
        metadata={"hookEvent": "sessionEnd", "cwd": cwd, "pr": pr_number},
    )
    root.update_trace(
        name=trace_name,
        session_id=session_id,
        tags=["sessionEnd", project_name] + ([f"pr-{pr_number}"] if pr_number else []),
    )

    # Process events in this segment
    for i, entry in enumerate(segment):
        entry_type = entry.get("type", "")
        data = entry.get("data", {})
        event_ts = entry.get("timestamp")

        if entry_type == "user.message":
            span = root.start_span(
                name="user-message",
                input=data.get("content", ""),
                metadata={"type": entry_type},
            )
            span.end(end_time=_parse_ts(event_ts))

        elif entry_type == "assistant.message":
            content = data.get("content", "")
            tool_requests = data.get("toolRequests", [])
            gen = root.start_generation(
                name="assistant-message",
                output=content,
                metadata={
                    "type": entry_type,
                    "messageId": data.get("messageId"),
                    "toolRequests": [tr.get("name") for tr in tool_requests],
                    "reasoningText": data.get("reasoningText"),
                },
            )
            gen.end(end_time=_parse_ts(event_ts))

        elif entry_type in ("tool.execution_start", "tool.start"):
            tool_name = data.get("toolName", "unknown")
            args = data.get("arguments", {})

            # Label sub-agent calls with their agent type
            display_name = f"tool:{tool_name}"
            if tool_name == "task" and isinstance(args, dict):
                agent_type = args.get("agent_type", "")
                if agent_type:
                    display_name = f"subagent:{agent_type}"

            span = root.start_span(
                name=display_name,
                input=json.dumps(args, default=str)[:5000],
                metadata={"type": entry_type, "toolCallId": data.get("toolCallId")},
            )
            # Find matching execution_complete within this segment
            end_ts = event_ts
            for j in range(i + 1, len(segment)):
                if (segment[j].get("type") in ("tool.execution_complete", "tool.complete")
                        and segment[j].get("data", {}).get("toolCallId") == data.get("toolCallId")):
                    result = segment[j].get("data", {}).get("result", {})
                    result_content = result.get("content", "") if isinstance(result, dict) else str(result)
                    span.update(output=result_content[:5000])
                    end_ts = segment[j].get("timestamp", event_ts)
                    break
            span.end(end_time=_parse_ts(end_ts))

        elif entry_type == "subagent.started":
            agent_name = data.get("agentName", data.get("agentDisplayName", "unknown"))
            display_name = f"subagent:{agent_name}"
            span = root.start_span(
                name=display_name,
                input=data.get("prompt", ""),
                metadata={"type": entry_type, "toolCallId": data.get("toolCallId")},
            )
            # Find matching subagent.completed
            end_ts = event_ts
            for j in range(i + 1, len(segment)):
                if (segment[j].get("type") == "subagent.completed"
                        and segment[j].get("data", {}).get("toolCallId") == data.get("toolCallId")):
                    end_ts = segment[j].get("timestamp", event_ts)
                    break
            span.end(end_time=_parse_ts(end_ts))

    root.end()
    langfuse.flush()

    trace_url = langfuse.get_trace_url(trace_id=root.trace_id)
    log(f"Trace sent for PR {pr_number or 'unknown'}, session: {session_id}, url: {trace_url}")

    # Save trace URL to the specific PR's metadata.json
    if pr_number and cwd:
        save_trace_url(cwd, pr_number, trace_url)

    return trace_url


def save_trace_url(cwd, pr_number, trace_url):
    """Save trace URL to the current model's experiment metadata.json for a PR."""
    pr_dir = Path(cwd) / "data" / "analysis" / pr_number
    if not pr_dir.exists():
        log(f"PR directory not found: {pr_dir}")
        return

    # Read current model from .model file to target the right experiment dir
    model_name = None
    model_file = Path(cwd) / ".model"
    if model_file.exists():
        model_name = model_file.read_text().strip()

    best_meta = None
    if model_name:
        # Find experiment dir matching the current model
        for meta_file in pr_dir.glob("*/metadata.json"):
            if meta_file.parent.name.startswith(model_name):
                best_meta = meta_file
                break

    if not best_meta:
        log(f"No experiment dir matching model '{model_name}' for PR {pr_number}, skipping")
        return

    if best_meta:
        try:
            meta = json.loads(best_meta.read_text())
            meta["traceUrl"] = trace_url
            best_meta.write_text(json.dumps(meta, indent=2) + "\n")
            log(f"Saved trace URL to {best_meta}")
        except Exception as e:
            log(f"Failed to update {best_meta}: {e}")


def main():
    try:
        from langfuse import Langfuse
    except ImportError:
        log("langfuse package not installed, skipping")
        return

    # Read hook input from stdin
    try:
        hook_input = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, Exception) as e:
        log(f"Failed to read stdin: {e}")
        return

    cwd = hook_input.get("cwd", "")
    session_id = hook_input.get("sessionId", "unknown")

    log(f"Hook input keys: {list(hook_input.keys())}")

    # Find transcript: CLI stores events in ~/.copilot/session-state/<id>/events.jsonl
    transcript = []
    transcript_file = None

    if session_id and session_id != "unknown":
        candidate = Path.home() / ".copilot" / "session-state" / session_id / "events.jsonl"
        if candidate.exists():
            transcript_file = str(candidate)

    if not transcript_file and cwd:
        session_dir = Path.home() / ".copilot" / "session-state"
        if session_dir.exists():
            best_match = None
            best_mtime = 0
            for ws_file in session_dir.glob("*/workspace.yaml"):
                try:
                    content = ws_file.read_text()
                    if f"cwd: {cwd}" in content:
                        events = ws_file.parent / "events.jsonl"
                        if events.exists() and events.stat().st_mtime > best_mtime:
                            best_mtime = events.stat().st_mtime
                            best_match = str(events)
                            session_id = ws_file.parent.name
                except Exception:
                    continue
            transcript_file = best_match

    if transcript_file:
        try:
            with open(transcript_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        transcript.append(json.loads(line))
            log(f"Loaded {len(transcript)} entries from {transcript_file}")
        except Exception as e:
            log(f"Failed to read transcript: {e}")
    else:
        log(f"No transcript found for session {session_id} cwd {cwd}")
        return

    # Initialize Langfuse
    try:
        langfuse = Langfuse(
            public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
            secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
            host=os.environ.get("LANGFUSE_BASE_URL", "https://cloud.langfuse.com"),
        )
    except Exception as e:
        log(f"Failed to init Langfuse: {e}")
        return

    # Split events into per-PR segments and create one trace per PR
    segments = split_events_by_pr(transcript)
    log(f"Split into {len(segments)} segments")

    for i, item in enumerate(segments):
        if isinstance(item, tuple):
            # Per-PR segment: (pr_number, events)
            pr_number, segment_events = item
            process_segment(langfuse, segment_events, session_id, cwd, i, pr_number=pr_number)
        else:
            # Fallback: per-prompt segment (list of events)
            segment = item
            has_user_msg = any(e.get("type") == "user.message" for e in segment)
            if not has_user_msg:
                continue
            process_segment(langfuse, segment, session_id, cwd, i)


if __name__ == "__main__":
    main()
