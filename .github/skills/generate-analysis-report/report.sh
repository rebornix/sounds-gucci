#!/bin/bash
set -euo pipefail

# Generate analysis report from bug-analyzer and fix-validator outputs
# Usage: ./report.sh [--input-dir <path>] [--output <file>] [--model <model>] [--experiment-tag <tag>]

# Default values
INPUT_DIR="data/analysis"
OUTPUT_FILE="data/analysis-results.md"
MODEL="${ANALYSIS_MODEL:-unknown}"
EXPERIMENT_TAG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --input-dir) INPUT_DIR="$2"; shift 2 ;;
    --output) OUTPUT_FILE="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --experiment-tag) EXPERIMENT_TAG="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "Generating analysis report..."
echo "Input directory: $INPUT_DIR"
echo "Output file: $OUTPUT_FILE"

# Validate input directory
if [[ ! -d "$INPUT_DIR" ]]; then
  echo "Error: Input directory does not exist: $INPUT_DIR"
  exit 1
fi

# Create output directory if needed
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Initialize counters
TOTAL_ANALYZED=0
TOTAL_WITH_PROPOSAL=0
TOTAL_WITH_VALIDATION=0
SCORE_SUM=0
SCORE_COUNT=0

# Collect data
declare -a RESULTS

# Process each analysis directory
for dir in "$INPUT_DIR"/*/; do
  [[ -d "$dir" ]] || continue
  
  PR_NUM=$(basename "$dir")
  METADATA_FILE="$dir/metadata.json"
  
  # Skip if no metadata
  if [[ ! -f "$METADATA_FILE" ]]; then
    echo "Skipping $PR_NUM: no metadata.json"
    continue
  fi
  
  ((TOTAL_ANALYZED++))
  
  # Extract metadata
  PR_TITLE=$(jq -r '.pr.title // "N/A"' "$METADATA_FILE")
  ISSUE_NUM=$(jq -r '.issue.number // "N/A"' "$METADATA_FILE")
  ISSUE_TITLE=$(jq -r '.issue.title // "N/A"' "$METADATA_FILE")
  REPO=$(jq -r '.repo // "N/A"' "$METADATA_FILE")
  
  # Check for proposal
  PROPOSAL_SUMMARY="Not analyzed"
  if [[ -f "$dir/proposal.md" ]]; then
    ((TOTAL_WITH_PROPOSAL++))
    # Extract summary from proposal (first heading after "Proposed Fix" or first paragraph)
    PROPOSAL_SUMMARY=$(grep -A 5 "## Proposed Fix\|## Root Cause" "$dir/proposal.md" 2>/dev/null | head -3 | tr '\n' ' ' | cut -c1-100 || echo "See details")
    PROPOSAL_SUMMARY="${PROPOSAL_SUMMARY}..."
  fi
  
  # Check for validation
  ALIGNMENT_SCORE="-"
  SCORE_LABEL="-"
  KEY_FINDINGS="Not validated"
  if [[ -f "$dir/validation.md" ]]; then
    ((TOTAL_WITH_VALIDATION++))
    # Extract alignment score
    SCORE_LINE=$(grep -i "Alignment Score:" "$dir/validation.md" 2>/dev/null | head -1 || echo "")
    if [[ -n "$SCORE_LINE" ]]; then
      ALIGNMENT_SCORE=$(echo "$SCORE_LINE" | grep -oE '[0-9]+' | head -1 || echo "-")
      SCORE_LABEL=$(echo "$SCORE_LINE" | grep -oE '\(.*\)' | tr -d '()' || echo "-")
      if [[ "$ALIGNMENT_SCORE" =~ ^[0-9]+$ ]]; then
        SCORE_SUM=$((SCORE_SUM + ALIGNMENT_SCORE))
        ((SCORE_COUNT++))
      fi
    fi
    # Extract key findings
    KEY_FINDINGS=$(grep -A 2 "### What the proposal got right\|## Detailed Feedback" "$dir/validation.md" 2>/dev/null | tail -2 | tr '\n' ' ' | cut -c1-80 || echo "See details")
  fi
  
  # Store result
  RESULTS+=("| [#$PR_NUM](https://github.com/$REPO/pull/$PR_NUM) | [#$ISSUE_NUM](https://github.com/$REPO/issues/$ISSUE_NUM) | $PROPOSAL_SUMMARY | $ALIGNMENT_SCORE/5 ($SCORE_LABEL) | $KEY_FINDINGS |")
  
  echo "Processed PR #$PR_NUM"
done

# Calculate average score
AVG_SCORE="-"
if [[ $SCORE_COUNT -gt 0 ]]; then
  AVG_SCORE=$(echo "scale=1; $SCORE_SUM / $SCORE_COUNT" | bc)
fi

# Generate report
cat > "$OUTPUT_FILE" << EOF
# Bug Fix Analysis Results

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Model:** $MODEL
**Experiment Tag:** ${EXPERIMENT_TAG:-none}

## Summary

| Metric | Value |
|--------|-------|
| Total PRs Analyzed | $TOTAL_ANALYZED |
| With Proposals | $TOTAL_WITH_PROPOSAL |
| With Validation | $TOTAL_WITH_VALIDATION |
| Average Alignment Score | $AVG_SCORE/5 |

## Results

| PR # | Issue # | Proposed Fix Summary | Alignment Score | Key Findings |
|------|---------|---------------------|-----------------|--------------|
EOF

# Add results
for result in "${RESULTS[@]}"; do
  echo "$result" >> "$OUTPUT_FILE"
done

# Add score legend
cat >> "$OUTPUT_FILE" << 'EOF'

---

## Alignment Score Legend

| Score | Label | Description |
|-------|-------|-------------|
| 5 | Excellent | Same files, same root cause, very similar approach |
| 4 | Good | Same/overlapping files, correct root cause, reasonable approach |
| 3 | Partial | Some correct files, partially correct root cause, different but viable approach |
| 2 | Weak | Few overlapping files, incorrect or incomplete root cause |
| 1 | Misaligned | Different files, wrong root cause, would not fix the bug |

## Next Steps

1. Review PRs with low alignment scores to understand gaps
2. Identify patterns in what the analyzer misses
3. Iterate on the bug-analyzer agent instructions based on findings

## Detailed Results

EOF

# Add detailed results for each PR
for dir in "$INPUT_DIR"/*/; do
  [[ -d "$dir" ]] || continue
  
  PR_NUM=$(basename "$dir")
  METADATA_FILE="$dir/metadata.json"
  
  [[ -f "$METADATA_FILE" ]] || continue
  
  PR_TITLE=$(jq -r '.pr.title // "N/A"' "$METADATA_FILE")
  
  cat >> "$OUTPUT_FILE" << EOF

### PR #$PR_NUM: $PR_TITLE

<details>
<summary>Click to expand</summary>

EOF
  
  # Include proposal if exists
  if [[ -f "$dir/proposal.md" ]]; then
    echo "#### Proposal" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$dir/proposal.md" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
  
  # Include validation if exists
  if [[ -f "$dir/validation.md" ]]; then
    echo "#### Validation" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$dir/validation.md" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
  
  echo "</details>" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

echo ""
echo "=========================================="
echo "Report generated: $OUTPUT_FILE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Total PRs analyzed: $TOTAL_ANALYZED"
echo "  - With proposals: $TOTAL_WITH_PROPOSAL"
echo "  - With validation: $TOTAL_WITH_VALIDATION"
echo "  - Average alignment score: $AVG_SCORE/5"
