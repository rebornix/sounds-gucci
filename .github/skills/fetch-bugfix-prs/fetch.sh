#!/bin/bash
set -euo pipefail

# Fetch bug-fix PRs with linked issues from a GitHub repository
# Usage: ./fetch.sh --author <user> --repo <owner/repo> --since <date> --until <date> [--output <file>]

# Default values
OUTPUT_FILE="data/prs-with-issues.md"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --author) AUTHOR="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    --until) UNTIL="$2"; shift 2 ;;
    --output) OUTPUT_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Validate required arguments
if [[ -z "${AUTHOR:-}" || -z "${REPO:-}" || -z "${SINCE:-}" || -z "${UNTIL:-}" ]]; then
  echo "Usage: $0 --author <user> --repo <owner/repo> --since <YYYY-MM-DD> --until <YYYY-MM-DD> [--output <file>]"
  exit 1
fi

echo "Fetching PRs from $REPO by $AUTHOR between $SINCE and $UNTIL..."

# Create output directory if needed
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Function to extract issue numbers from text
extract_issues() {
  local text="$1"
  local issues=""
  
  # Match patterns like: fixes #123, closes #456, resolves #789, #123
  local hash_issues=$(echo "$text" | grep -oE '(fixes|closes|resolves|fix|close|resolve)?[[:space:]]*#[0-9]+' | grep -oE '[0-9]+' || true)
  
  # Match URL patterns like: https://github.com/owner/repo/issues/123
  local url_issues=$(echo "$text" | grep -oE 'github\.com/[^/]+/[^/]+/issues/[0-9]+' | grep -oE '[0-9]+$' || true)
  
  # Combine and deduplicate
  echo -e "${hash_issues}\n${url_issues}" | grep -v '^$' | sort -u || true
}

# Function to get linked issues from PR timeline
get_timeline_linked_issues() {
  local pr_number="$1"
  gh api "repos/$REPO/issues/$pr_number/timeline" --paginate 2>/dev/null | \
    jq -r '.[] | select(.event == "cross-referenced" or .event == "connected") | .source.issue.number // empty' 2>/dev/null | \
    sort -u || true
}

# Search for PRs by author in date range
echo "Searching for PRs..."
PRS=$(gh pr list \
  --repo "$REPO" \
  --author "$AUTHOR" \
  --state merged \
  --search "merged:${SINCE}..${UNTIL}" \
  --json number,title,body,labels,mergeCommit,mergedAt,createdAt \
  --limit 500)

# Filter for bug-fix PRs
echo "Filtering for bug-fix PRs..."
BUG_PRS=$(echo "$PRS" | jq '[.[] | select(
  (.labels | map(.name | ascii_downcase) | any(contains("bug") or contains("fix") or contains("regression"))) or
  (.title | ascii_downcase | test("fix|fixes|fixed|resolve|closes|bug"))
)]')

PR_COUNT=$(echo "$BUG_PRS" | jq 'length')
echo "Found $PR_COUNT bug-fix PRs"

# Initialize output file only if it doesn't exist or is empty
if [[ ! -f "$OUTPUT_FILE" ]] || [[ ! -s "$OUTPUT_FILE" ]]; then
  cat > "$OUTPUT_FILE" << EOF
# Bug-Fix PRs with Linked Issues

Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

| PR # | PR Title | Issue # | Issue Title | PR Created | Issue Created | Valid | Merge Commit | Parent Commit |
|------|----------|---------|-------------|------------|---------------|-------|--------------|---------------|
EOF
  echo "Created new output file: $OUTPUT_FILE"
else
  # Remove any existing summary lines so we can update them later
  sed -i.bak '/^---$/,$d' "$OUTPUT_FILE" 2>/dev/null || true
  rm -f "${OUTPUT_FILE}.bak"
  echo "Updating existing output file: $OUTPUT_FILE"
fi

# Function to check if PR/issue pair already exists in output
pair_exists() {
  local pr="$1"
  local issue="$2"
  grep -q "#${pr}.*#${issue}" "$OUTPUT_FILE" 2>/dev/null
}

# Process each PR using process substitution to avoid subshell issues
ADDED_COUNT=0
SKIPPED_COUNT=0
VALID_COUNT=0
while read -r pr; do
  PR_NUM=$(echo "$pr" | jq -r '.number')
  PR_TITLE=$(echo "$pr" | jq -r '.title' | sed 's/|/\\|/g')
  PR_BODY=$(echo "$pr" | jq -r '.body // ""')
  MERGE_COMMIT=$(echo "$pr" | jq -r '.mergeCommit.oid // "N/A"')
  LABELS=$(echo "$pr" | jq -r '[.labels[].name] | join(", ")')
  PR_CREATED=$(echo "$pr" | jq -r '.createdAt // "N/A"')
  PR_CREATED_SHORT="${PR_CREATED:0:10}"
  
  echo "Processing PR #$PR_NUM: $PR_TITLE"
  
  # Get parent commit
  PARENT_COMMIT="N/A"
  if [[ "$MERGE_COMMIT" != "N/A" && -n "$MERGE_COMMIT" ]]; then
    PARENT_COMMIT=$(gh api "repos/$REPO/commits/$MERGE_COMMIT" --jq '.parents[0].sha' 2>/dev/null || echo "N/A")
  fi
  
  # Collect linked issues from multiple sources
  LINKED_ISSUES=""
  
  # From PR title
  TITLE_ISSUES=$(extract_issues "$PR_TITLE")
  
  # From PR body
  BODY_ISSUES=$(extract_issues "$PR_BODY")
  
  # From timeline events
  TIMELINE_ISSUES=$(get_timeline_linked_issues "$PR_NUM")
  
  # Combine and deduplicate (|| true to handle empty results with pipefail)
  LINKED_ISSUES=$(echo -e "${TITLE_ISSUES}\n${BODY_ISSUES}\n${TIMELINE_ISSUES}" | { grep -v '^$' || true; } | sort -u | tr '\n' ',' | sed 's/,$//')
  
  if [[ -z "$LINKED_ISSUES" ]]; then
    echo "  No linked issues found, skipping..."
    continue
  fi
  
  # Process each linked issue
  for ISSUE_NUM in $(echo "$LINKED_ISSUES" | tr ',' '\n'); do
    # Skip if this PR/issue pair already exists
    if pair_exists "$PR_NUM" "$ISSUE_NUM"; then
      echo "  Skipping #$ISSUE_NUM (already exists)"
      ((SKIPPED_COUNT++)) || true
      continue
    fi
    
    # Get issue details including creation date
    ISSUE_DATA=$(gh api "repos/$REPO/issues/$ISSUE_NUM" 2>/dev/null || echo "{}")
    ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title // "N/A"' | sed 's/|/\\|/g')
    ISSUE_CREATED=$(echo "$ISSUE_DATA" | jq -r '.created_at // "N/A"')
    ISSUE_CREATED_SHORT="${ISSUE_CREATED:0:10}"
    
    # Check if issue was created before PR (valid for analysis)
    IS_VALID="❌"
    if [[ "$ISSUE_CREATED" != "N/A" && "$PR_CREATED" != "N/A" ]]; then
      if [[ "$ISSUE_CREATED" < "$PR_CREATED" ]]; then
        IS_VALID="✅"
        ((VALID_COUNT++)) || true
      fi
    fi
    
    # Short commit hashes for display
    SHORT_MERGE="${MERGE_COMMIT:0:7}"
    SHORT_PARENT="${PARENT_COMMIT:0:7}"
    
    # Append to output with new columns
    echo "| [#$PR_NUM](https://github.com/$REPO/pull/$PR_NUM) | $PR_TITLE | [#$ISSUE_NUM](https://github.com/$REPO/issues/$ISSUE_NUM) | $ISSUE_TITLE | $PR_CREATED_SHORT | $ISSUE_CREATED_SHORT | $IS_VALID | \`$SHORT_MERGE\` | \`$SHORT_PARENT\` |" >> "$OUTPUT_FILE"
    
    echo "  Added issue #$ISSUE_NUM: $ISSUE_TITLE (Valid: $IS_VALID)"
    ((ADDED_COUNT++)) || true
  done
done < <(echo "$BUG_PRS" | jq -c '.[]')

# Add summary
TOTAL_ROWS=$(grep -c "^|.*#[0-9]" "$OUTPUT_FILE" 2>/dev/null || echo "0")
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "**Total entries:** $TOTAL_ROWS" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**Legend:** ✅ = Issue created before PR (valid for analysis), ❌ = Issue created after PR (retrospective)" >> "$OUTPUT_FILE"

echo ""
echo "Done! Output written to: $OUTPUT_FILE"
echo "  New entries added: $ADDED_COUNT"
echo "  Valid for analysis: $VALID_COUNT"
echo "  Entries skipped (already exist): $SKIPPED_COUNT"
echo "  Total entries in file: $TOTAL_ROWS"
