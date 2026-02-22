#!/bin/bash
set -euo pipefail

# Setup environment for analyzing a PR/issue pair
# Usage: ./setup.sh --pr <num> --issue <num> --repo <owner/repo> --clone-path <path> [--output-dir <path>] [--model <model>] [--agent-version <version>] [--tags <comma-separated>]

# Default values
OUTPUT_DIR=""
TAGS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --pr) PR_NUM="$2"; shift 2 ;;
    --issue) ISSUE_NUM="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --clone-path) CLONE_PATH="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --tags) TAGS="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Validate required arguments
if [[ -z "${PR_NUM:-}" || -z "${ISSUE_NUM:-}" || -z "${REPO:-}" || -z "${CLONE_PATH:-}" ]]; then
  echo "Usage: $0 --pr <num> --issue <num> --repo <owner/repo> --clone-path <path> [--output-dir <path>]"
  exit 1
fi

# Set default output directory
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="data/analysis/$PR_NUM"
fi

echo "Setting up analysis environment for PR #$PR_NUM (Issue #$ISSUE_NUM)..."
echo "Repository: $REPO"
echo "Clone path: $CLONE_PATH"
echo "Output dir: $OUTPUT_DIR"

# Validate clone path exists
if [[ ! -d "$CLONE_PATH/.git" ]]; then
  echo "Error: No git repository found at $CLONE_PATH"
  exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Fetch PR details
echo ""
echo "Fetching PR #$PR_NUM details..."
PR_DATA=$(gh pr view "$PR_NUM" --repo "$REPO" --json title,body,commits,mergeCommit,files,labels)

PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
PR_BODY=$(echo "$PR_DATA" | jq -r '.body // ""')
MERGE_COMMIT=$(echo "$PR_DATA" | jq -r '.mergeCommit.oid')
LABELS=$(echo "$PR_DATA" | jq -r '[.labels[].name] | join(", ")')

echo "  Title: $PR_TITLE"
echo "  Merge commit: $MERGE_COMMIT"

# Get parent commit
echo "Fetching parent commit..."
PARENT_COMMIT=$(gh api "repos/$REPO/commits/$MERGE_COMMIT" --jq '.parents[0].sha')
echo "  Parent commit: $PARENT_COMMIT"

# Get changed files
echo "Extracting changed files..."
mkdir -p "$OUTPUT_DIR/actual_fix"
echo "$PR_DATA" | jq -r '.files[].path' > "$OUTPUT_DIR/actual_fix/changed-files.txt"
FILE_COUNT=$(wc -l < "$OUTPUT_DIR/actual_fix/changed-files.txt" | tr -d ' ')
echo "  $FILE_COUNT files changed"

# Fetch PR diff
echo "Fetching PR diff..."
gh pr diff "$PR_NUM" --repo "$REPO" > "$OUTPUT_DIR/actual_fix/pr-diff.patch" 2>/dev/null || \
  gh api "repos/$REPO/pulls/$PR_NUM" -H "Accept: application/vnd.github.v3.diff" > "$OUTPUT_DIR/actual_fix/pr-diff.patch"

# Fetch commit messages
echo "Extracting commit messages..."
COMMIT_MESSAGES=$(echo "$PR_DATA" | jq -r '.commits[].messageHeadline' | sed 's/^/- /')

# Write PR context file
echo "Writing PR context..."
cat > "$OUTPUT_DIR/actual_fix/pr.md" << EOF
# PR #$PR_NUM: $PR_TITLE

**Repository:** $REPO
**Labels:** $LABELS
**Merge Commit:** \`$MERGE_COMMIT\`
**Parent Commit:** \`$PARENT_COMMIT\`

## Description

$PR_BODY

## Commits

$COMMIT_MESSAGES

## Changed Files

$(cat "$OUTPUT_DIR/actual_fix/changed-files.txt" | sed 's/^/- /')
EOF

# Fetch issue details
echo ""
echo "Fetching Issue #$ISSUE_NUM details..."
ISSUE_DATA=$(gh issue view "$ISSUE_NUM" --repo "$REPO" --json title,body,comments,labels,author,createdAt)

ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body // ""')
ISSUE_AUTHOR=$(echo "$ISSUE_DATA" | jq -r '.author.login')
ISSUE_CREATED=$(echo "$ISSUE_DATA" | jq -r '.createdAt')
ISSUE_LABELS=$(echo "$ISSUE_DATA" | jq -r '[.labels[].name] | join(", ")')

echo "  Title: $ISSUE_TITLE"
echo "  Author: $ISSUE_AUTHOR"

# Write issue context file
echo "Writing issue context..."
cat > "$OUTPUT_DIR/issue.md" << EOF
# Issue #$ISSUE_NUM: $ISSUE_TITLE

**Repository:** $REPO
**Author:** @$ISSUE_AUTHOR
**Created:** $ISSUE_CREATED
**Labels:** $ISSUE_LABELS

## Description

$ISSUE_BODY

## Comments

EOF

# Append comments
COMMENT_COUNT=$(echo "$ISSUE_DATA" | jq '.comments | length')
echo "  $COMMENT_COUNT comments found"

echo "$ISSUE_DATA" | jq -c '.comments[]' | while read -r comment; do
  AUTHOR=$(echo "$comment" | jq -r '.author.login')
  CREATED=$(echo "$comment" | jq -r '.createdAt')
  BODY=$(echo "$comment" | jq -r '.body')
  
  cat >> "$OUTPUT_DIR/issue.md" << EOF

### @$AUTHOR ($CREATED)

$BODY

---
EOF
done

# Write metadata JSON
echo "Writing metadata..."
cat > "$OUTPUT_DIR/metadata.json" << EOF
{
  "pr": $PR_NUM,
  "prTitle": $(echo "$PR_TITLE" | jq -R .),
  "mergeCommit": "$MERGE_COMMIT",
  "parentCommit": "$PARENT_COMMIT",
  "fileCount": $FILE_COUNT,
  "issue": $ISSUE_NUM,
  "issueTitle": $(echo "$ISSUE_TITLE" | jq -R .),
  "issueAuthor": "$ISSUE_AUTHOR",
  "commentCount": $COMMENT_COUNT,
  "repo": "$REPO",
  "clonePath": "$CLONE_PATH",
  "tags": [$(echo "$TAGS" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | jq -R . | paste -sd, -)]
}
EOF

# Checkout parent commit in the local clone
echo ""
echo "Checking out parent commit in local clone..."
pushd "$CLONE_PATH" > /dev/null

# Stash any local changes
if [[ -n $(git status --porcelain) ]]; then
  echo "  Stashing local changes..."
  git stash push -m "Auto-stash before PR analysis (PR #$PR_NUM)"
fi

# Fetch latest and checkout parent commit
echo "  Fetching from origin..."
git fetch origin --quiet

echo "  Checking out $PARENT_COMMIT..."
git checkout "$PARENT_COMMIT" --quiet 2>/dev/null || {
  echo "  Fetching specific commit..."
  git fetch origin "$PARENT_COMMIT" --quiet
  git checkout "$PARENT_COMMIT" --quiet
}

CURRENT_COMMIT=$(git rev-parse HEAD)
echo "  Now at: $CURRENT_COMMIT"

popd > /dev/null

# Summary
echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Context files created in: $OUTPUT_DIR"
echo "  - issue.md                   : Issue description and comments"
echo "  - metadata.json              : PR/issue metadata"
echo "  - actual_fix/pr.md           : PR description and commit messages"
echo "  - actual_fix/pr-diff.patch   : Actual PR diff (for validation)"
echo "  - actual_fix/changed-files.txt : List of changed files"
echo ""
echo "Local clone checked out to parent commit: ${PARENT_COMMIT:0:7}"
echo ""
echo "Next steps:"
echo "  1. Use @bug-analyzer to analyze the issue and propose a fix"
echo "  2. Use @fix-validator to compare the proposal with the actual PR"
