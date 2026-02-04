---
name: fetch-bugfix-prs
description: Fetch bug-fix PRs with linked issues from a GitHub repository. Use this when asked to find PRs that fix bugs, especially when needing to analyze the relationship between PRs and their linked issues.
---

# Fetch Bug-Fix PRs Skill

This skill fetches pull requests that are bug fixes with linked issues from a GitHub repository.

## Usage

Run the `fetch.sh` script with the following parameters:

```bash
./fetch.sh --author <username> --repo <owner/repo> --since <YYYY-MM-DD> --until <YYYY-MM-DD> --output <path>
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `--author` | Yes | GitHub username of the PR author | `osortega` |
| `--repo` | Yes | Repository in `owner/repo` format | `microsoft/vscode` |
| `--since` | Yes | Start date (inclusive) | `2025-12-02` |
| `--until` | Yes | End date (inclusive) | `2026-02-02` |
| `--output` | No | Output file path (default: `data/prs-with-issues.md`) | `./results.md` |

### Example

```bash
# Fetch Osvaldo's bug-fix PRs from the last 2 months
./.github/skills/fetch-bugfix-prs/fetch.sh \
  --author osortega \
  --repo microsoft/vscode \
  --since 2025-12-02 \
  --until 2026-02-02
```

## Output Format

The script generates a markdown file with a table:

| PR # | PR Title | Issue # | Issue Title | Merge Commit | Parent Commit | Labels |
|------|----------|---------|-------------|--------------|---------------|--------|

## How It Works

1. Uses `gh` CLI to search for PRs by author in the date range
2. Filters for bug fixes by checking:
   - Labels containing "bug", "fix", or "regression"
   - Title containing "fix", "fixes", "fixed", "resolve", "closes"
3. Extracts linked issues from:
   - PR title (e.g., "Fixes #12345")
   - PR body (GitHub issue references)
   - Timeline events (linked issues via GitHub UI)
4. Fetches issue details for each linked issue
5. Gets merge commit and its parent for each PR

## Prerequisites

- `gh` CLI installed and authenticated
- `jq` for JSON processing
