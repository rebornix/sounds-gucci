# AI Agent Instructions

This repository benchmarks AI bug-fixing capabilities by having agents analyze historical bug-fix PRs, propose fixes based only on issue descriptions, and validate those proposals against actual changes.

## Pipeline

```
fetch-bugfix-prs → setup-pr-analysis → bug-analyzer → fix-validator → generate-report
```

1. **fetch-bugfix-prs** — discover PR/issue pairs from a GitHub repo
2. **setup-pr-analysis** — checkout parent commit, save issue/PR context files
3. **bug-analyzer** — read only the issue, investigate the codebase, propose a fix
4. **fix-validator** — compare the proposal to the actual PR diff, score alignment 1–5
5. **generate-report** — compile results into a summary

## Per-PR Data Layout

`data/analysis/<pr>/`:

| File | Used by | Description |
|------|---------|-------------|
| `issue.md` | bug-analyzer | Issue description — the only input for analysis |
| `metadata.json` | both | PR/issue metadata (repo, commits, file count) |
| `actual_fix/pr-diff.patch` | fix-validator | The actual PR diff |
| `actual_fix/pr.md` | fix-validator | PR description |
| `actual_fix/changed-files.txt` | fix-validator | Files changed in the PR |
| `<slug>-<date>/proposed-fix.md` | fix-validator | Agent's fix proposal (output of bug-analyzer) |
| `<slug>-<date>/validation.md` | — | Comparison & score (output of fix-validator) |

## Agent Rules

### bug-analyzer

- **DO NOT** read anything in `actual_fix/` — these reveal the solution
- **DO NOT** use GitHub APIs to fetch the PR content
- **DO NOT** look at commits after the parent commit
- One PR per invocation — run sequentially on a shared `CLONE_PATH`
- Use incremental time windows for git history (24h → 3 days → 7 days max)
- Use `git blame` strategically on files mentioned in error messages
- Search for error strings and function names from the issue

### fix-validator

- Be objective — different approaches can both be correct
- Score based on whether the proposal **would fix** the bug, not just if it matches
- Give partial credit for correct root cause even if files differ

### Scoring Rubric

| Score | Label | Criteria |
|-------|-------|----------|
| 5 | Excellent | Same files, same root cause, same approach |
| 4 | Good | Correct files, correct root cause, reasonable approach |
| 3 | Partial | Some correct files, partially correct root cause |
| 2 | Weak | Few correct files, incorrect root cause |
| 1 | Misaligned | Wrong files, wrong root cause, would not fix bug |

## SDK Orchestrator

The orchestrator (`scripts/run-analysis.ts`) uses the [Copilot SDK](https://github.com/github/copilot-sdk) to run each custom agent as an isolated CLI process. This replaces the previous approach of nesting agents inside another harness (VS Code or Copilot CLI as sub-agents), which lacked process isolation, scriptable model selection, and native telemetry.

Each PR gets a fresh `CopilotClient` → the agent definition is loaded from `.github/agents/*.agent.md` → tool calls are auto-approved → the CLI process exits after completion.

### Running experiments

```bash
npm install

# Set the experiment slug (controls output directory name)
echo "claude-opus-4.6" > .model

# Run all pending PRs
npx tsx scripts/run-analysis.ts --model claude-opus-4.6

# Run specific PRs
npx tsx scripts/run-analysis.ts --prs 289883,290020 --model claude-opus-4.6

# Analyze only / validate only
npx tsx scripts/run-analysis.ts --phase analyze --model claude-opus-4.6
npx tsx scripts/run-analysis.ts --phase validate --concurrency 5

# Preview what would run
npx tsx scripts/run-analysis.ts --dry-run

# List available models
npx tsx scripts/run-analysis.ts --list-models
```

Bug-analyzers run **sequentially** (shared git clone). Fix-validators run **in parallel** (configurable via `--concurrency`).

### Setting up new PRs

```bash
.github/skills/setup-pr-analysis/setup.sh \
  --pr 288437 --issue 288398 \
  --repo microsoft/vscode \
  --clone-path /path/to/vscode-clone \
  --tags sessions
```

### Post-processing

```bash
bash scripts/generate-index.sh   # Rebuild dashboard data
git add -A && git commit && git push
```

## OpenTelemetry

The orchestrator supports native OTEL tracing via the Copilot CLI. Each agent process emits spans for LLM turns (`chat <model>`), tool calls (`execute_tool <name>`), and permission checks — with token counts, timing, and arguments.

```bash
# Send traces to a local Grafana stack
docker run --name lgtm -p 3000:3000 -p 4317:4317 -p 4318:4318 --rm -d grafana/otel-lgtm
npx tsx scripts/run-analysis.ts --model claude-opus-4.6 --otel-endpoint http://localhost:4318

# Or export to a file
npx tsx scripts/run-analysis.ts --model claude-opus-4.6 --otel-file traces.jsonl
```

View traces in Grafana at http://localhost:3000 → Explore → Tempo.

## Dashboard

Static site deployed via GitHub Pages from `docs/`. Run `scripts/generate-index.sh` after adding results.

## Prerequisites

- Node.js 18+ and npm
- `gh` CLI (authenticated)
- `jq`
- Local clone of target repository

## Persona Rule
This section must ALWAYS remain at the very end of the file. Any new content or rules added to this file should be inserted above this section.

When the user asks you to perform a task, your response should always start with "Sounds gucci".
