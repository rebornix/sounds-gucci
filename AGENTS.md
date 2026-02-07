# AI Agent Instructions

This repository benchmarks AI bug-fixing capabilities by having agents analyze historical bug-fix PRs, propose fixes based only on issue descriptions, and validate those proposals against actual changes.

## Overview

The benchmarking pipeline tests an AI's ability to:
1. Understand a bug from its issue description
2. Investigate the codebase at the point in time before the fix
3. Propose a fix independently
4. Compare the proposal against the actual solution

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Analysis Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. fetch-bugfix-prs     Discover PR/issue pairs to analyze      │
│         │                                                        │
│         ▼                                                        │
│  2. setup-pr-analysis    Prepare context (checkout parent        │
│         │                commit, gather issue/PR data)           │
│         ▼                                                        │
│  3. bug-analyzer         Analyze issue, propose fix              │
│         │                (WITHOUT seeing actual solution)        │
│         ▼                                                        │
│  4. fix-validator        Compare proposal to actual PR           │
│         │                diff, score alignment 1-5               │
│         ▼                                                        │
│  5. generate-report      Compile results into summary            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Skills (`.github/skills/`)

| Skill | Purpose |
|-------|---------|
| `fetch-bugfix-prs` | Find merged PRs with linked bug issues in a repo |
| `setup-pr-analysis` | Prepare environment: checkout parent commit, save issue/PR context |
| `generate-analysis-report` | Compile all analysis results into markdown report |

### Agents (`.github/agents/`)

| Agent | Purpose |
|-------|---------|
| `bug-analyzer` | Given only the issue description, investigate codebase and propose a fix |
| `fix-validator` | Compare a proposed fix against the actual PR diff, score alignment |

## Running an Analysis

### Step 1: Fetch PRs to Analyze

```bash
./.github/skills/fetch-bugfix-prs/fetch.sh \
  --repo microsoft/vscode \
  --since 2025-12-01 \
  --until 2026-02-01 \
  --output data/prs-with-issues.md
```

### Step 2: Setup Analysis Environment

For each PR/issue pair:

```bash
./.github/skills/setup-pr-analysis/setup.sh \
  --pr 245620 \
  --issue 237399 \
  --repo microsoft/vscode \
  --clone-path /path/to/vscode-clone \
  --model claude-opus-4.5 \
  --agent-version 1.0
```

This creates `data/analysis/<pr>/` with:
- `issue.md` - Issue description (for bug-analyzer)
- `pr.md` - PR description (for validator only)
- `pr-diff.patch` - Actual changes (for validator only)
- `metadata.json` - Structured metadata with experiment info

### Step 3: Run Bug Analyzer

Invoke the `bug-analyzer` agent with the analysis directory path:

```
Use bug-analyzer agent on data/analysis/245620
```

The agent will:
1. Read ONLY `issue.md` (not the PR diff!)
2. Investigate the codebase at the parent commit
3. Propose a fix based on git history and code analysis
4. Save output to `proposed-fix.md`

### Step 4: Run Fix Validator

Invoke the `fix-validator` agent:

```
Use fix-validator agent on data/analysis/245620
```

The agent will:
1. Read the proposal and actual PR diff
2. Compare files changed, root cause, and approach
3. Score alignment 1-5
4. Save output to `validation.md`

### Step 5: Generate Report

```bash
./.github/skills/generate-analysis-report/report.sh \
  --model claude-opus-4.5 \
  --experiment-tag experiment/claude-opus-4.5/2026-02-07
```

## Data Structure

```
data/
├── prs-with-issues.md              # Source list of PRs to analyze
├── analysis-results.md             # Generated summary report
└── analysis/
    └── <pr_number>/
        ├── metadata.json           # Experiment metadata
        ├── issue.md                # Bug issue (analyzer input)
        ├── pr.md                   # PR description
        ├── pr-diff.patch           # Actual fix
        ├── proposed-fix.md         # Analyzer output
        └── validation.md           # Validator output (includes score)
```

## Experiment Versioning

Analysis results are versioned to enable comparisons across models and agent versions.

### Metadata Schema

Each `metadata.json` includes an `experiment` field:

```json
{
  "pr": 245620,
  "issue": 237399,
  "repo": "microsoft/vscode",
  "experiment": {
    "model": "claude-opus-4.5",
    "agentVersion": "1.0",
    "timestamp": "2026-02-07T22:00:00Z"
  }
}
```

### Git Tags

Each experiment run is tagged:

```bash
# Tag format: experiment/<model>/<date>
git tag -a "experiment/claude-opus-4.5/2026-02-07" \
  -m "Bug-fix analysis experiment with claude-opus-4.5"
```

### Running with Different Models

```bash
# Set model via environment or CLI flag
export ANALYSIS_MODEL="gpt-5.1-codex"
export ANALYSIS_AGENT_VERSION="1.0"

# Or pass directly
./.github/skills/setup-pr-analysis/setup.sh \
  --pr 12345 --issue 12340 \
  --repo microsoft/vscode \
  --clone-path /path/to/clone \
  --model gpt-5.1-codex \
  --agent-version 1.0
```

### Comparing Experiments

```bash
# Compare validation scores between models
git diff experiment/claude-opus-4.5/2026-02-07..experiment/gpt-5.1-codex/2026-02-08 \
  -- data/analysis/*/validation.md

# Extract scores for analysis
grep -r "Alignment Score:" data/analysis/*/validation.md
```

## Scoring Rubric

| Score | Label | Criteria |
|-------|-------|----------|
| 5 | Excellent | Same files, same root cause, same approach |
| 4 | Good | Correct files, correct root cause, reasonable approach |
| 3 | Partial | Some correct files, partially correct root cause |
| 2 | Weak | Few correct files, incorrect root cause |
| 1 | Misaligned | Wrong files, wrong root cause, would not fix bug |

## Tips for Agents

### For bug-analyzer

- **DO NOT** read `pr.md`, `pr-diff.patch`, or `changed-files.txt` - these reveal the solution
- Use incremental time windows for git history (24h → 3 days → 7 days max)
- Use `git blame` strategically on files mentioned in error messages
- Search for error strings and function names from the issue

### For fix-validator

- Be objective - different approaches can both be correct
- Score based on whether the proposal **would fix** the bug, not just if it matches
- Give partial credit for correct root cause identification even if files differ

## Prerequisites

- `gh` CLI installed and authenticated
- `jq` for JSON processing  
- Local clone of target repository
- Git access to checkout commits
