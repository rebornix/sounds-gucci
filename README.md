# sounds-gucci

**Experimental framework for bug diagnosis for VS Code and chat using GitHub Copilot agents and skills**

## Overview

This project explores whether agents can independently diagnose bugs and propose fixes by:

1. **Reading only the issue description** (not the solution)
2. **Analyzing git history** to understand recent changes
3. **Proposing a fix** based on codebase analysis
4. **Validating proposals** against actual PR changes

### Results Summary

| Metric | Value |
|--------|-------|
| PRs Analyzed | 9 |
| Average Score | **3.4/5** |
| File Identification Accuracy | 89% |

## Architecture

```
sounds-gucci/
├── .github/
│   ├── agents/                    # Copilot Chat agents
│   │   ├── bug-analyzer.agent.md  # Analyzes issues, proposes fixes
│   │   └── fix-validator.agent.md # Compares proposals to actual PRs
│   └── skills/                    # Automation scripts
│       ├── fetch-bugfix-prs/      # Fetches PRs with linked issues
│       ├── setup-pr-analysis/     # Prepares analysis environment
│       └── generate-analysis-report/
└── data/
    ├── prs-with-issues.md         # Analysis results table
    └── analysis/                  # Per-PR analysis artifacts
        └── <pr-number>/
            ├── issue.md           # Issue description
            ├── proposal.md        # Agent's fix proposal
            ├── validation.md      # Comparison results
            └── pr-diff.patch      # Actual PR changes
```

## How It Works

### Phase 1: Prepare
Fetch bug-fix PRs from a repository with linked issues:

```bash
.github/skills/fetch-bugfix-prs/fetch.sh \
  --author <username> \
  --repo <owner/repo> \
  --since 2025-12-01 \
  --until 2026-02-01
```

### Phase 2: Analyze
Set up analysis environment and run the bug-analyzer agent:

```bash
# Setup context files and checkout parent commit
.github/skills/setup-pr-analysis/setup.sh \
  --pr 281123 \
  --issue 281154 \
  --repo microsoft/vscode \
  --clone-path /path/to/local/clone

# Then in Copilot Chat:
@bug-analyzer data/analysis/281123
```

### Phase 3: Validate
Compare the proposal against the actual fix:

```bash
# In Copilot Chat:
@fix-validator data/analysis/281123
```

## Scoring Rubric

| Score | Label | Criteria |
|-------|-------|----------|
| 5/5 | Excellent | Same files, same root cause, very similar approach |
| 4/5 | Good | Correct files, right root cause, reasonable approach |
| 3/5 | Partial | Some correct files, partially correct root cause |
| 2/5 | Weak | Few overlapping files, incorrect root cause |
| 1/5 | Misaligned | Wrong files, wrong root cause |

## Key Findings

### What works well:
- **File identification** — Agent correctly identifies relevant files ~89% of the time
- **Problem area narrowing** — Successfully locates the right module/component
- **Pattern recognition** — Good at spotting conditional logic bugs

### Areas for improvement:
- **Root cause precision** — Often proposes different (sometimes over-engineered) approaches
- **Multi-file fixes** — Tends to miss secondary files
- **Edge cases** — Misses subtle conditions like idempotency guards

## Requirements

- `gh` CLI (authenticated)
- `jq` for JSON processing
- Local clone of the target repository
- VS Code with GitHub Copilot

## Testing

Run the same checks locally that CI performs:
- `./scripts/generate-index.sh` rebuilds `docs/data/index.json` from `data/analysis`.
- `./.github/skills/generate-analysis-report/report.sh --model <model>` regenerates `data/analysis-results.md` for the dashboard.

## Filtering Valid Issues

The system automatically filters out:
- **Retrospective issues** — Created after the PR was merged
- **Follow-up issues** — Reference the fixing PR in their description
- **Non-bug issues** — Feature requests, debt tracking, etc.

Only issues created *before* the PR are considered valid for analysis.

## License

MIT
