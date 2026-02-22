#!/usr/bin/env python3
"""
Fetch Langfuse traces and save them locally to experiment directories.

Usage:
  python3 scripts/fetch-traces.py                    # Fetch all missing traces
  python3 scripts/fetch-traces.py --pr 289039        # Fetch trace for specific PR
  python3 scripts/fetch-traces.py --overwrite         # Re-fetch all traces
"""

import json
import os
import sys
from pathlib import Path


def load_dotenv():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def fetch_trace(trace_id, pk, sk, base_url):
    """Fetch a trace with all observations from Langfuse API."""
    import subprocess
    r = subprocess.run(
        ["curl", "-s", "-u", f"{pk}:{sk}", f"{base_url}/api/public/traces/{trace_id}"],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        return None
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return None


def simplify_trace(trace):
    """Convert Langfuse trace to a simplified format for rendering."""
    observations = trace.get("observations", [])

    # Build spans with hierarchy
    spans = []
    for obs in observations:
        span = {
            "id": obs["id"],
            "parentId": obs.get("parentObservationId"),
            "name": obs["name"],
            "type": obs["type"],  # SPAN, GENERATION
            "startTime": obs.get("startTime"),
            "endTime": obs.get("endTime"),
            "latency": obs.get("latency"),
            "input": None,
            "output": None,
            "metadata": obs.get("metadata"),
        }

        # Include input/output but truncate
        inp = obs.get("input")
        if inp:
            span["input"] = str(inp)[:2000] if isinstance(inp, str) else json.dumps(inp, default=str)[:2000]
        out = obs.get("output")
        if out:
            span["output"] = str(out)[:2000] if isinstance(out, str) else json.dumps(out, default=str)[:2000]

        spans.append(span)

    # Sort by startTime
    spans.sort(key=lambda s: s.get("startTime") or "")

    return {
        "traceId": trace["id"],
        "name": trace["name"],
        "timestamp": trace.get("timestamp"),
        "tags": trace.get("tags", []),
        "sessionId": trace.get("sessionId"),
        "latency": trace.get("latency"),
        "totalCost": trace.get("totalCost"),
        "spans": spans,
    }


def main():
    load_dotenv()

    pk = os.environ.get("LANGFUSE_PUBLIC_KEY")
    sk = os.environ.get("LANGFUSE_SECRET_KEY")
    base_url = os.environ.get("LANGFUSE_BASE_URL", "https://us.cloud.langfuse.com")

    if not pk or not sk:
        print("Error: LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY required in .env")
        sys.exit(1)

    # Parse args
    target_pr = None
    overwrite = False
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--pr" and i < len(sys.argv) - 1:
            target_pr = sys.argv[i + 1]
        elif arg == "--overwrite":
            overwrite = True

    repo_root = Path(__file__).resolve().parent.parent
    analysis_dir = repo_root / "data" / "analysis"

    fetched = 0
    skipped = 0
    errors = 0

    for pr_dir in sorted(analysis_dir.iterdir()):
        if not pr_dir.is_dir() or not pr_dir.name.isdigit():
            continue
        if target_pr and pr_dir.name != target_pr:
            continue

        for exp_dir in sorted(pr_dir.iterdir()):
            if not exp_dir.is_dir():
                continue

            meta_file = exp_dir / "metadata.json"
            trace_file = exp_dir / "trace.json"

            if not meta_file.exists():
                continue
            if trace_file.exists() and not overwrite:
                skipped += 1
                continue

            meta = json.loads(meta_file.read_text())
            trace_url = meta.get("traceUrl", "")
            if not trace_url:
                continue

            # Extract trace ID from URL
            trace_id = trace_url.rstrip("/").split("/")[-1]

            print(f"Fetching PR {pr_dir.name}/{exp_dir.name} (trace {trace_id[:12]}...)...", end=" ")
            trace = fetch_trace(trace_id, pk, sk, base_url)

            if trace and "id" in trace:
                simplified = simplify_trace(trace)
                trace_file.write_text(json.dumps(simplified, indent=2) + "\n")
                span_count = len(simplified["spans"])
                print(f"OK ({span_count} spans)")
                fetched += 1
            else:
                print("FAILED")
                errors += 1

    print(f"\nDone: {fetched} fetched, {skipped} skipped, {errors} errors")


if __name__ == "__main__":
    main()
