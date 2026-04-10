#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SETUP_SCRIPT="$SCRIPT_DIR/setup.sh"

INPUT_FILE=""
CLONE_PATH=""
OUTPUT_ROOT="$REPO_ROOT/data/analysis"
TAGS=""
KEY_BY="issue"
ONLY_VALID=1
SKIP_EXISTING=0
REPO=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --input) INPUT_FILE="$2"; shift 2 ;;
    --clone-path) CLONE_PATH="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --output-root) OUTPUT_ROOT="$2"; shift 2 ;;
    --tags) TAGS="$2"; shift 2 ;;
    --key-by) KEY_BY="$2"; shift 2 ;;
    --include-retrospective) ONLY_VALID=0; shift ;;
    --skip-existing) SKIP_EXISTING=1; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$INPUT_FILE" || -z "$CLONE_PATH" ]]; then
  echo "Usage: $0 --input <markdown-file> --clone-path <path> [--repo <owner/repo>] [--output-root <dir>] [--tags <csv>] [--key-by pr|issue] [--include-retrospective] [--skip-existing]"
  exit 1
fi

if [[ "$KEY_BY" != "pr" && "$KEY_BY" != "issue" ]]; then
  echo "Error: --key-by must be either 'pr' or 'issue'"
  exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Error: Input file not found: $INPUT_FILE"
  exit 1
fi

if [[ ! -e "$CLONE_PATH/.git" ]]; then
  echo "Error: No git repository found at $CLONE_PATH"
  exit 1
fi

if [[ "$INPUT_FILE" != /* ]]; then
  INPUT_FILE="$REPO_ROOT/$INPUT_FILE"
fi

if [[ "$OUTPUT_ROOT" != /* ]]; then
  OUTPUT_ROOT="$REPO_ROOT/$OUTPUT_ROOT"
fi

mkdir -p "$OUTPUT_ROOT"

extract_repo() {
  echo "$1" | sed -nE 's#.*https://github.com/([^/]+/[^/]+)/pull/[0-9]+.*#\1#p' | head -1
}

extract_pr() {
  echo "$1" | grep -oE '/pull/[0-9]+' | head -1 | grep -oE '[0-9]+' || true
}

extract_issue() {
  echo "$1" | grep -oE '/issues/[0-9]+' | head -1 | grep -oE '[0-9]+' || true
}

processed=0
skipped_invalid=0
skipped_existing=0
skipped_unparseable=0
skipped_duplicate=0

SEEN_IDS_FILE=$(mktemp)
trap 'rm -f "$SEEN_IDS_FILE"' EXIT

while IFS= read -r line; do
  [[ "$line" == *"/pull/"* && "$line" == *"/issues/"* ]] || continue

  if [[ $ONLY_VALID -eq 1 && "$line" != *"| ✅ |"* ]]; then
    ((skipped_invalid++)) || true
    continue
  fi

  row_repo="$REPO"
  if [[ -z "$row_repo" ]]; then
    row_repo=$(extract_repo "$line")
  fi

  pr_num=$(extract_pr "$line")
  issue_num=$(extract_issue "$line")

  if [[ -z "$row_repo" || -z "$pr_num" || -z "$issue_num" ]]; then
    echo "Skipping unparseable row: $line"
    ((skipped_unparseable++)) || true
    continue
  fi

  analysis_id="$pr_num"
  if [[ "$KEY_BY" == "issue" ]]; then
    analysis_id="$issue_num"
  fi

  existing_pr=$(grep -m1 "^${analysis_id}|" "$SEEN_IDS_FILE" | cut -d'|' -f2 || true)
  if [[ -n "$existing_pr" ]]; then
    echo "Skipping duplicate analysis id $analysis_id (already prepared from PR #$existing_pr)"
    ((skipped_duplicate++)) || true
    continue
  fi
  printf '%s|%s\n' "$analysis_id" "$pr_num" >> "$SEEN_IDS_FILE"

  output_dir="$OUTPUT_ROOT/$analysis_id"
  if [[ $SKIP_EXISTING -eq 1 && -d "$output_dir" ]]; then
    echo "Skipping existing analysis directory: $output_dir"
    ((skipped_existing++)) || true
    continue
  fi

  echo "Preparing analysis $analysis_id (PR #$pr_num, Issue #$issue_num, Repo $row_repo)..."
  cmd=(
    "$SETUP_SCRIPT"
    --pr "$pr_num"
    --issue "$issue_num"
    --repo "$row_repo"
    --clone-path "$CLONE_PATH"
    --output-dir "$output_dir"
  )

  if [[ -n "$TAGS" ]]; then
    cmd+=(--tags "$TAGS")
  fi

  "${cmd[@]}"
  ((processed++)) || true
done < "$INPUT_FILE"

echo
echo "=========================================="
echo "Batch setup complete"
echo "=========================================="
echo "Prepared: $processed"
echo "Skipped invalid: $skipped_invalid"
echo "Skipped duplicate: $skipped_duplicate"
echo "Skipped existing: $skipped_existing"
echo "Skipped unparseable: $skipped_unparseable"