#!/bin/bash
# Generate index.json from analysis data for GitHub Pages visualization

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANALYSIS_DIR="${REPO_ROOT}/data/analysis"
OUTPUT_FILE="${REPO_ROOT}/docs/data/index.json"

echo "Generating data index from ${ANALYSIS_DIR}..."

# Start JSON array
echo '[' > "$OUTPUT_FILE"

first=true
for dir in "$ANALYSIS_DIR"/*/; do
    [ -d "$dir" ] || continue
    
    pr_number=$(basename "$dir")
    metadata_file="${dir}metadata.json"
    validation_file="${dir}validation.md"
    proposal_file="${dir}proposed-fix.md"
    issue_file="${dir}issue.md"
    
    # Skip if no metadata
    [ -f "$metadata_file" ] || continue
    
    # Extract score from validation.md (look for "Alignment Score: X/5")
    score=""
    if [ -f "$validation_file" ]; then
        score=$(grep -oE 'Alignment Score: [0-9.]+/5' "$validation_file" | grep -oE '[0-9.]+' | head -1 || echo "")
    fi
    
    # Extract proposal summary (first heading after "## Proposed Fix" or "## Root Cause")
    proposal_summary=""
    if [ -f "$proposal_file" ]; then
        proposal_summary=$(grep -A1 "^## Root Cause" "$proposal_file" | tail -1 | head -c 200 | sed 's/"/\\"/g' || echo "")
    fi
    
    # Extract issue title from issue.md (first # heading)
    issue_title_from_file=""
    if [ -f "$issue_file" ]; then
        issue_title_from_file=$(grep -m1 "^# " "$issue_file" | sed 's/^# //' | head -c 150 | sed 's/"/\\"/g' || echo "")
    fi
    
    # Read metadata
    pr_title=$(jq -r '.pr.title // ""' "$metadata_file" | sed 's/"/\\"/g')
    pr_merge_commit=$(jq -r '.pr.mergeCommit // ""' "$metadata_file")
    issue_number=$(jq -r '.issue.number // ""' "$metadata_file")
    issue_title=$(jq -r '.issue.title // ""' "$metadata_file" | sed 's/"/\\"/g')
    issue_author=$(jq -r '.issue.author // ""' "$metadata_file")
    repo=$(jq -r '.repo // ""' "$metadata_file")
    model=$(jq -r '.experiment.model // "unknown"' "$metadata_file")
    agent_version=$(jq -r '.experiment.agentVersion // "unknown"' "$metadata_file")
    timestamp=$(jq -r '.experiment.timestamp // ""' "$metadata_file")
    file_count=$(jq -r '.pr.fileCount // 0' "$metadata_file")
    
    # Add comma for all but first entry
    if [ "$first" = true ]; then
        first=false
    else
        echo ',' >> "$OUTPUT_FILE"
    fi
    
    # Write JSON entry
    cat >> "$OUTPUT_FILE" << EOF
  {
    "pr": ${pr_number},
    "prTitle": "${pr_title}",
    "prMergeCommit": "${pr_merge_commit}",
    "issue": ${issue_number:-null},
    "issueTitle": "${issue_title}",
    "issueAuthor": "${issue_author}",
    "repo": "${repo}",
    "score": ${score:-null},
    "model": "${model}",
    "agentVersion": "${agent_version}",
    "timestamp": "${timestamp}",
    "fileCount": ${file_count},
    "proposalSummary": "${proposal_summary}"
  }
EOF
done

echo ']' >> "$OUTPUT_FILE"

# Pretty print with jq if available
if command -v jq &> /dev/null; then
    jq '.' "$OUTPUT_FILE" > "${OUTPUT_FILE}.tmp" && mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
fi

count=$(jq 'length' "$OUTPUT_FILE")
echo "Generated ${OUTPUT_FILE} with ${count} analyses"
