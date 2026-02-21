#!/usr/bin/env python3
"""
Langfuse hook for Copilot CLI.

Captures conversation transcripts from sessionEnd hooks
and sends them to Langfuse as traces with full tool call details.

Required environment variables (set in .env):
  LANGFUSE_PUBLIC_KEY  - Your Langfuse public key
  LANGFUSE_SECRET_KEY  - Your Langfuse secret key
  LANGFUSE_BASE_URL    - Langfuse host (default: https://cloud.langfuse.com)
  LANGFUSE_ENABLED     - Set to "true" to enable tracing

Optional:
  LANGFUSE_DEBUG       - Set to "true" for verbose logging
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path


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
    # CLI sessionEnd doesn't include sessionId — derive from workspace.yaml
    session_id = hook_input.get("sessionId", "unknown")

    log(f"Hook input keys: {list(hook_input.keys())}")
    log(f"Hook input: {json.dumps(hook_input, indent=2, default=str)[:2000]}")

    # Find transcript: CLI stores events in ~/.copilot/session-state/<id>/events.jsonl
    transcript = []
    transcript_file = None

    # If sessionId provided, look it up directly
    if session_id and session_id != "unknown":
        candidate = Path.home() / ".copilot" / "session-state" / session_id / "events.jsonl"
        if candidate.exists():
            transcript_file = str(candidate)

    # Otherwise find the most recent session for this cwd
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

    project_name = Path(cwd).name if cwd else "unknown"
    trace_name = f"{project_name}/session"

    root = langfuse.start_span(
        name=trace_name,
        metadata={"hookEvent": "sessionEnd", "cwd": cwd},
    )
    root.update_trace(
        name=trace_name,
        session_id=session_id,
        tags=["sessionEnd", project_name],
    )

    # Process JSONL transcript entries
    # Types: session.start, user.message, assistant.turn_start,
    # assistant.message, assistant.turn_end, tool.execution_start, tool.execution_complete
    for i, entry in enumerate(transcript):
        entry_type = entry.get("type", "")
        data = entry.get("data", {})

        if entry_type == "user.message":
            span = root.start_span(
                name="user-message",
                input=data.get("content", ""),
                metadata={"type": entry_type},
            )
            span.end()

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
            gen.end()

        elif entry_type == "tool.execution_start":
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
            # Find matching execution_complete
            for j in range(i + 1, len(transcript)):
                if (transcript[j].get("type") == "tool.execution_complete"
                        and transcript[j].get("data", {}).get("toolCallId") == data.get("toolCallId")):
                    result = transcript[j].get("data", {}).get("result", {})
                    result_content = result.get("content", "") if isinstance(result, dict) else str(result)
                    span.update(output=result_content[:5000])
                    break
            span.end()

    root.end()
    langfuse.flush()

    trace_url = langfuse.get_trace_url(trace_id=root.trace_id)
    log(f"Trace sent for session: {session_id}, url: {trace_url}")

    # Save trace URL to experiment metadata.json files touched in this session
    if cwd:
        analysis_dir = Path(cwd) / "data" / "analysis"
        if analysis_dir.exists():
            # Find experiment dirs modified during this session (last 30 min)
            import time
            cutoff = time.time() - 1800
            for meta_file in analysis_dir.glob("*/*/metadata.json"):
                if meta_file.stat().st_mtime > cutoff:
                    try:
                        meta = json.loads(meta_file.read_text())
                        meta["traceUrl"] = trace_url
                        meta_file.write_text(json.dumps(meta, indent=2) + "\n")
                        log(f"Saved trace URL to {meta_file}")
                    except Exception as e:
                        log(f"Failed to update {meta_file}: {e}")


if __name__ == "__main__":
    main()
