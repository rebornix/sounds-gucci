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

## Detailed Step Reference

### Setup creates these files per PR

`data/analysis/<pr>/`:
- `issue.md` - Issue description (bug-analyzer input)
- `metadata.json` - PR/issue metadata (no model info)
- `actual_fix/pr.md` - PR description (validator only)
- `actual_fix/pr-diff.patch` - Actual changes (validator only)
- `actual_fix/changed-files.txt` - Files changed

### Bug Analyzer

Invoke with: `Use bug-analyzer agent on data/analysis/<pr>`

The agent will:
1. Read ONLY `issue.md` and `metadata.json` (not any files in `actual_fix/`!)
2. Investigate the codebase at the parent commit
3. Propose a fix based on git history and code analysis
4. Save output to `<model>-<date>/proposed-fix.md`

### Fix Validator

Invoke with: `Use fix-validator agent on data/analysis/<pr>`

The agent will:
1. Read the proposal and `actual_fix/pr-diff.patch`
2. Compare files changed, root cause, and approach
3. Score alignment 1-5
4. Save output to `<model>-<date>/validation.md`

## Data Structure

```
data/
├── prs-with-issues.md              # Source list of PRs to analyze
├── analysis-results.md             # Generated summary report
└── analysis/
    └── <pr_number>/
        ├── metadata.json           # PR/issue metadata
        ├── issue.md                # Bug issue (analyzer input)
        ├── actual_fix/             # Real solution
        │   ├── pr-diff.patch       # Actual fix
        │   ├── pr.md               # PR description
        │   └── changed-files.txt   # Files changed
        ├── claude-opus-4.6-2026-02-22/  # Experiment results
        │   ├── proposed-fix.md     # Analyzer output
        │   └── validation.md       # Validator output (score)
        └── gpt-5.3-codex-2026-02-22/
            ├── proposed-fix.md
            └── validation.md
```

## Experiment Versioning

Analysis results are versioned by experiment subdirectory name (`<model>-<date>`). The PR-level `metadata.json` contains only PR/issue info — no model details.

### Metadata Schema

Each PR-level `metadata.json`:

```json
{
  "pr": 245620,
  "prTitle": "Fix session tracking bug",
  "mergeCommit": "abc123",
  "parentCommit": "def456",
  "fileCount": 3,
  "issue": 237399,
  "issueTitle": "Sessions not tracked correctly",
  "issueAuthor": "benibenj",
  "commentCount": 2,
  "repo": "microsoft/vscode",
  "tags": ["sessions"]
}
```

### Running with Different Models

Update the `model:` field in `.github/agents/bug-analyzer.agent.md` and `.github/agents/fix-validator.agent.md` before each experiment run:

```bash
# For opus
sed -i '' 's/^model:.*/model: claude-opus-4.6/' .github/agents/*.agent.md

# For codex
sed -i '' 's/^model:.*/model: gpt-5.3-codex/' .github/agents/*.agent.md
```

### Setup new PRs

```bash
./.github/skills/setup-pr-analysis/setup.sh \
  --pr 12345 --issue 12340 \
  --repo microsoft/vscode \
  --clone-path /path/to/clone \
  --tags sessions
```

### Comparing Experiments

```bash
# Compare validation scores between models
diff <(grep "Alignment Score:" data/analysis/*/claude-opus-4.6-*/validation.md) \
     <(grep "Alignment Score:" data/analysis/*/gpt-5.3-codex-*/validation.md)

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

- **DO NOT** read anything in `actual_fix/` — these reveal the solution
- **DO NOT** use GitHub APIs to fetch the PR content
- **DO NOT** look at commits after the parent commit
- Use incremental time windows for git history (24h → 3 days → 7 days max)
- Use `git blame` strategically on files mentioned in error messages
- Search for error strings and function names from the issue

### For fix-validator

- Be objective - different approaches can both be correct
- Score based on whether the proposal **would fix** the bug, not just if it matches
- Give partial credit for correct root cause identification even if files differ

## Quick Start (Running a New Experiment)

### 1. Set the model

Update the `model:` field in both agent files:

```bash
sed -i '' 's/^model:.*/model: gpt-5.3-codex/' .github/agents/*.agent.md
```

Also set `.model` for experiment directory naming:

```bash
echo "gpt-5.3-codex" > .model
```

### 2. Fetch PRs (if needed)

Skip if `data/prs-with-issues.md` already has the PRs you want:

```bash
./.github/skills/fetch-bugfix-prs/fetch.sh \
  --repo microsoft/vscode \
  --since 2025-12-01 --until 2026-02-01
```

### 3. Setup analysis environment

Use the `setup-pr-analysis` skill for each PR/issue pair. This creates the PR directory under `data/analysis/<pr>/`:

```bash
./.github/skills/setup-pr-analysis/setup.sh \
  --pr 288437 --issue 288398 \
  --repo microsoft/vscode \
  --clone-path /path/to/vscode-clone \
  --tags sessions
```

### 4. Run analysis

In VS Code with custom agents:

```
For each PR directory in data/analysis/, run @bug-analyzer then @fix-validator.
Process them sequentially.
```

### 5. Post-processing

After analysis completes:

```bash
# Rebuild dashboard data
bash scripts/generate-index.sh

# Fetch Langfuse traces locally (requires LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY)
python3 scripts/fetch-traces.py

# Deploy
git add -A && git commit -m "Add <model> experiment results" && git push
```

## Langfuse Tracing

The `.github/hooks/langfuse.json` hook automatically sends traces to Langfuse on session end. It:

- Splits session events by PR number (one trace per PR)
- Uses deterministic trace IDs (`md5(pr_number:model_name)`) to avoid duplicates on re-runs
- Saves trace URLs to experiment `metadata.json` files
- Only targets experiment directories matching the `.model` file

### Environment Variables

Set these for Langfuse integration:

| Variable | Description |
|----------|-------------|
| `LANGFUSE_PUBLIC_KEY` | Langfuse project public key |
| `LANGFUSE_SECRET_KEY` | Langfuse project secret key |
| `LANGFUSE_HOST` | Langfuse host URL (default: `https://cloud.langfuse.com`) |

### Fetching Traces Locally

```bash
# Fetch all missing traces
python3 scripts/fetch-traces.py

# Fetch/overwrite a specific PR
python3 scripts/fetch-traces.py --pr 288437 --overwrite
```

Traces are saved as `trace.json` in each experiment directory and rendered in the dashboard's Trace tab.

## Dashboard

The dashboard is a static site deployed via GitHub Pages from `docs/`.

- **Index generation**: `scripts/generate-index.sh` scans `data/analysis/` and builds `docs/data/index.json`
- **Symlink**: `docs/data/analysis` → `../../data/analysis` (so analysis files are served directly)
- **CI**: The GitHub Actions workflow runs `generate-index.sh` before deploying

Always run `scripts/generate-index.sh` after adding or modifying analysis results.

## Prerequisites

- `gh` CLI installed and authenticated
- `jq` for JSON processing  
- Local clone of target repository
- Git access to checkout commits
- Python 3 (for Langfuse hook and trace fetching)

## Persona Rule
This section must ALWAYS remain at the very end of the file. Any new content or rules added to this file should be inserted above this section.

When the user asks you to perform a task, your response should always start with "Sounds gucci".
