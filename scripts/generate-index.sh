#!/bin/bash
# Generate index.json from analysis data for GitHub Pages visualization

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANALYSIS_DIR="${REPO_ROOT}/data/analysis"
OUTPUT_FILE="${REPO_ROOT}/docs/data/index.json"

echo "Generating data index from ${ANALYSIS_DIR}..."

# Collect all entries as JSON objects
entries="[]"

for pr_dir in "$ANALYSIS_DIR"/*/; do
    [ -d "$pr_dir" ] || continue
    
    pr_number=$(basename "$pr_dir")
    # Skip non-numeric directories
    [[ "$pr_number" =~ ^[0-9]+$ ]] || continue
    
    # Shared files at PR level
    issue_file="${pr_dir}issue.md"
    
    # Iterate over experiment subdirectories
    for exp_dir in "$pr_dir"/*/; do
        [ -d "$exp_dir" ] || continue
        
        metadata_file="${exp_dir}metadata.json"
        validation_file="${exp_dir}validation.md"
        proposal_file="${exp_dir}proposed-fix.md"
        
        # Skip if no metadata
        [ -f "$metadata_file" ] || continue
        
        experiment_id=$(basename "$exp_dir")
        
        # Skip deprecated experiments
        [ -f "${exp_dir}.deprecated" ] && continue
        
        # Extract score from validation.md
        score=""
        if [ -f "$validation_file" ]; then
            score=$(grep -oE 'Alignment Score: [0-9.]+/5' "$validation_file" | grep -oE '[0-9.]+' | head -1 || echo "")
        fi
        
        # Extract proposal summary
        proposal_summary=""
        if [ -f "$proposal_file" ]; then
            proposal_summary=$(grep -A1 "^## Root Cause" "$proposal_file" | tail -1 | head -c 200 | sed 's/"/\\"/g' || echo "")
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
        agent_commit=$(jq -r '.experiment.agentCommit // "unknown"' "$metadata_file")
        timestamp=$(jq -r '.experiment.timestamp // ""' "$metadata_file")
        trace_url=$(jq -r '.traceUrl // ""' "$metadata_file")
        file_count=$(jq -r '.pr.fileCount // 0' "$metadata_file")
        
        # Build JSON entry using jq for proper escaping
        entry=$(jq -n \
            --argjson pr "$pr_number" \
            --arg prTitle "$pr_title" \
            --arg prMergeCommit "$pr_merge_commit" \
            --argjson issue "${issue_number:-null}" \
            --arg issueTitle "$issue_title" \
            --arg issueAuthor "$issue_author" \
            --arg repo "$repo" \
            --argjson score "${score:-null}" \
            --arg model "$model" \
            --arg agentVersion "$agent_version" \
            --arg agentCommit "$agent_commit" \
            --arg experimentId "$experiment_id" \
            --arg timestamp "$timestamp" \
            --argjson fileCount "${file_count:-0}" \
            --arg proposalSummary "$proposal_summary" \
            --arg traceUrl "$trace_url" \
            '{
                pr: $pr,
                prTitle: $prTitle,
                prMergeCommit: $prMergeCommit,
                issue: $issue,
                issueTitle: $issueTitle,
                issueAuthor: $issueAuthor,
                repo: $repo,
                score: $score,
                model: $model,
                agentVersion: $agentVersion,
                agentCommit: $agentCommit,
                experimentId: $experimentId,
                timestamp: $timestamp,
                fileCount: $fileCount,
                proposalSummary: $proposalSummary,
                traceUrl: $traceUrl
            }')
        
        entries=$(echo "$entries" | jq --argjson e "$entry" '. += [$e]')
    done
done

# Write output
echo "$entries" | jq '.' > "$OUTPUT_FILE"

count=$(jq 'length' "$OUTPUT_FILE")
experiments=$(jq '[.[].experimentId] | unique | length' "$OUTPUT_FILE")
echo "Generated ${OUTPUT_FILE} with ${count} entries across ${experiments} experiment(s)"
