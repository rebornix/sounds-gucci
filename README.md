# sounds-gucci

**Experimental framework for bug diagnosis for VS Code and chat using GitHub Copilot agents and skills**

## Overview

This project benchmarks whether AI agents can independently diagnose bugs and propose fixes given only an issue description. It runs against historical bug-fix PRs from [microsoft/vscode](https://github.com/microsoft/vscode) and scores how well the proposed fix aligns with the actual solution.

The analysis targets recent commits — given how fast the VS Code project moves, the agent must navigate active development history. It also considers satellite repositories like [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) when issues span across codebases.

### How it works

1. **Fetch** merged bug-fix PRs with linked issues from a GitHub repository
2. **Setup** analysis environment — checkout the parent commit, save issue/PR context
3. **Analyze** — a bug-analyzer agent reads only the issue description, investigates the codebase, and proposes a fix
4. **Validate** — a fix-validator agent compares the proposal against the actual PR diff and scores alignment 1–5
5. **Visualize** — results are published to the [dashboard](https://rebornix.github.io/sounds-gucci/) with score distributions, experiment comparison, and per-PR trace timelines

## Architecture

```
sounds-gucci/
├── .github/
│   ├── agents/                    # Copilot Chat agents
│   │   ├── bug-analyzer.agent.md  # Analyzes issues, proposes fixes
│   │   └── fix-validator.agent.md # Compares proposals to actual PRs
│   ├── hooks/                     # CLI hooks
│   │   └── langfuse.json          # Langfuse tracing on session end
│   └── skills/                    # Automation skills
│       ├── fetch-bugfix-prs/      # Fetches PRs with linked issues
│       ├── setup-pr-analysis/     # Prepares analysis environment
│       └── generate-analysis-report/
├── scripts/
│   ├── langfuse-hook.py           # Per-PR trace splitting & upload
│   ├── fetch-traces.py            # Download traces locally
│   └── generate-index.sh          # Build dashboard data
├── data/
│   └── analysis/                  # Per-PR analysis artifacts
│       └── <pr-number>/
│           ├── metadata.json      # PR/issue metadata (no model info)
│           ├── issue.md           # Issue description (analyzer input)
│           ├── actual_fix/        # Real solution (validator input)
│           │   ├── pr-diff.patch  # Actual PR changes
│           │   ├── pr.md          # PR description
│           │   └── changed-files.txt
│           └── <experiment-id>/   # e.g. gpt-5.3-codex-2026-02-21
│               ├── proposed-fix.md # Agent's fix proposal
│               ├── validation.md  # Comparison & score
│               └── trace.json     # Langfuse trace data
└── docs/                          # Dashboard (GitHub Pages)
```

## Quick Start

```bash
# 1. Set the model for this experiment
echo "gpt-5.3-codex" > .model

# 2. Fetch bug-fix PRs
.github/skills/fetch-bugfix-prs/fetch.sh \
  --repo microsoft/vscode \
  --since 2025-12-01 --until 2026-02-01

# 3. Setup analysis for a PR
.github/skills/setup-pr-analysis/setup.sh \
  --pr 288437 --issue 288398 \
  --repo microsoft/vscode \
  --clone-path /path/to/vscode-clone \
  --tags sessions

# 4. Run analysis (in Copilot CLI)
# "For each PR in data/analysis/ missing proposed-fix.md, run bug-analyzer then fix-validator"

# 5. Post-processing
bash scripts/generate-index.sh
python3 scripts/fetch-traces.py
git add -A && git commit && git push
```

See [AGENTS.md](AGENTS.md) for the full operational runbook.

## Scoring Rubric

| Score | Label | Criteria |
|-------|-------|----------|
| 5/5 | Excellent | Same files, same root cause, very similar approach |
| 4/5 | Good | Correct files, right root cause, reasonable approach |
| 3/5 | Partial | Some correct files, partially correct root cause |
| 2/5 | Weak | Few overlapping files, incorrect root cause |
| 1/5 | Misaligned | Wrong files, wrong root cause |

## Key Findings

**What works well:**
- **File identification** — agents correctly identify relevant files ~89% of the time
- **Problem area narrowing** — successfully locates the right module/component
- **Pattern recognition** — good at spotting conditional logic bugs

**Areas for improvement:**
- **Root cause precision** — often proposes different (sometimes over-engineered) approaches
- **Multi-file fixes** — tends to miss secondary files
- **Edge cases** — misses subtle conditions like idempotency guards

**Does the harness matter?**

Yes — the agent harness (tooling, prompting strategy, context management) absolutely influences results. However, in these experiments we don't optimize for it. As long as we use state-of-the-art models, their general tool-use capabilities are sufficient to exercise the core diagnostic loop. The focus here is on comparing model reasoning ability, not harness engineering.

## Requirements

- `gh` CLI (authenticated)
- `jq` for JSON processing
- Python 3 (for Langfuse tracing)
- Local clone of the target repository
- VS Code with GitHub Copilot

## License

MIT
