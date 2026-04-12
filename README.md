# sounds-gucci

**Benchmarks whether AI agents can independently diagnose bugs and propose fixes from issue descriptions alone.**

Runs against historical bug-fix PRs from [microsoft/vscode](https://github.com/microsoft/vscode), scores how well proposed fixes align with actual solutions, and publishes results to the [dashboard](https://rebornix.github.io/sounds-gucci/).

## How it works

1. **Fetch** merged bug-fix PRs with linked issues
2. **Setup** analysis environment — checkout the parent commit, save issue/PR context
3. **Analyze** — an agent reads only the issue, investigates the codebase, proposes a fix
4. **Validate** — another agent compares the proposal to the actual PR diff, scores 1–5
5. **Visualize** — results go to the dashboard with score distributions and trace timelines

The [SDK orchestrator](scripts/run-analysis.ts) runs each agent as an isolated process via the [Copilot SDK](https://github.com/github/copilot-sdk), with explicit model selection and native [OpenTelemetry](https://opentelemetry.io/) tracing.

## Quick Start

```bash
npm install

# Fetch PRs and setup analysis environment
.github/skills/fetch-bugfix-prs/fetch.sh --repo microsoft/vscode --since 2025-12-01
.github/skills/setup-pr-analysis/setup.sh \
  --pr 288437 --issue 288398 --repo microsoft/vscode --clone-path /path/to/clone

# Run analysis
npx tsx scripts/run-analysis.ts --model claude-opus-4.6

# Post-processing
bash scripts/generate-index.sh && git add -A && git commit && git push
```

See [AGENTS.md](AGENTS.md) for the full runbook.

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | Same files, same root cause, very similar approach |
| 4 | Correct files, right root cause, reasonable approach |
| 3 | Some correct files, partially correct root cause |
| 2 | Few overlapping files, incorrect root cause |
| 1 | Wrong files, wrong root cause |

## Key Findings

- **File identification** — agents correctly identify relevant files ~89% of the time
- **Root cause precision** — often proposes different (sometimes over-engineered) approaches
- **Multi-file fixes** — tends to miss secondary files affected by the change

## Requirements

- Node.js 18+ and npm
- `gh` CLI (authenticated)
- `jq`
- Local clone of the target repository

## License

MIT
