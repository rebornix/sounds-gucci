---
name: setup-pr-analysis
description: Set up the local environment for analyzing a specific PR/issue pair. Use this before running the bug-analyzer agent to checkout the parent commit and prepare context files.
---

# Setup PR Analysis Skill

This skill prepares the local environment for analyzing a bug-fix PR by checking out the parent commit and gathering context.

## Usage

Run the `setup.sh` script with the following parameters:

```bash
./setup.sh --pr <number> --issue <number> --repo <owner/repo> --clone-path <path> [--output-dir <path>] [--tags <comma-separated>]
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `--pr` | Yes | PR number to analyze | `12345` |
| `--issue` | Yes | Linked issue number | `12340` |
| `--repo` | Yes | Repository in `owner/repo` format | `microsoft/vscode` |
| `--clone-path` | Yes | Path to local repo clone | `/Users/penlv/Code/Work/vscode2` |
| `--output-dir` | No | Directory for context files (default: `data/analysis/<pr>`) | `./context` |
| `--tags` | No | Comma-separated tags for categorization | `sessions,error-telemetry` |

### Example

```bash
# Setup analysis for PR #12345 linked to issue #12340
./.github/skills/setup-pr-analysis/setup.sh \
  --pr 12345 \
  --issue 12340 \
  --repo microsoft/vscode \
  --clone-path /Users/penlv/Code/Work/vscode2
```

## What It Does

1. **Fetches PR details**: Gets merge commit, parent commit, PR description, changed files
2. **Fetches issue details**: Gets issue title, body, and all comments
3. **Checks out parent commit**: Switches local clone to the state before the fix
4. **Generates context files**:
  - `issue.md` - Issue title, body, and comments
  - `metadata.json` - PR/issue metadata (no model info)
  - `actual_fix/pr.md` - PR title, body, and commit messages (for fix-validator only)
  - `actual_fix/pr-diff.patch` - The actual PR diff (for validator comparison)
  - `actual_fix/changed-files.txt` - List of files changed in the PR

## Output Structure

```
data/analysis/<pr>/
├── issue.md           # Issue context for bug-analyzer
├── metadata.json      # PR/issue metadata
└── actual_fix/        # Real solution (for fix-validator only)
    ├── pr.md          # PR description
    ├── pr-diff.patch  # Actual fix diff
    └── changed-files.txt
```

## Prerequisites

- `gh` CLI installed and authenticated
- `jq` for JSON processing
- Local clone of the repository at the specified path
- Git access to checkout commits
