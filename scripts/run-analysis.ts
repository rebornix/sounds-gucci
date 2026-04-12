#!/usr/bin/env npx tsx
/**
 * Orchestrator for the bug-fix analysis pipeline.
 *
 * Uses the Copilot SDK to run bug-analyzer and fix-validator agents
 * as isolated CLI processes with native OpenTelemetry support.
 *
 * Usage:
 *   npx tsx scripts/run-analysis.ts --prs 289883,290020 --model claude-opus-4.6
 *   npx tsx scripts/run-analysis.ts --phase validate --concurrency 5
 *   npx tsx scripts/run-analysis.ts --model gpt-5.4 --otel-endpoint http://localhost:4318
 *   npx tsx scripts/run-analysis.ts --dry-run
 *
 * Or via npm script:
 *   npm run analyze -- --prs 289883 --model claude-opus-4.6
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import {
  readFileSync,
  existsSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// Ensure the CLI process inherits a cwd at the repo root so agent prompts
// that reference relative paths (data/analysis/…, .config, .model) work.
process.chdir(ROOT);

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function readDotModel(): string {
  const p = join(ROOT, ".model");
  if (!existsSync(p)) throw new Error("No .model file at repo root");
  return readFileSync(p, "utf-8").trim();
}

function writeDotModel(slug: string): void {
  writeFileSync(join(ROOT, ".model"), slug + "\n");
}

/** Extract the prompt body from a .agent.md file (everything after the YAML frontmatter). */
function readAgentPrompt(agentName: string): string {
  const p = join(ROOT, ".github", "agents", `${agentName}.agent.md`);
  if (!existsSync(p)) throw new Error(`Agent definition not found: ${p}`);
  const raw = readFileSync(p, "utf-8");
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1].trim() : raw;
}

// ---------------------------------------------------------------------------
// PR discovery
// ---------------------------------------------------------------------------

/** Find the experiment sub-directory for a given PR + slug (exact or slug-date pattern). */
function findExperimentDir(pr: string, slug: string): string | null {
  const prDir = join(ROOT, "data", "analysis", pr);
  if (!existsSync(prDir)) return null;
  for (const e of readdirSync(prDir, { withFileTypes: true })) {
    if (e.isDirectory() && (e.name === slug || e.name.startsWith(`${slug}-`))) {
      return e.name;
    }
  }
  return null;
}

/**
 * Auto-discover PRs that still need work for the given phase + slug.
 *
 * - analyze: PRs with issue.md but no proposed-fix.md in the experiment dir
 * - validate: PRs with proposed-fix.md but no validation.md
 */
function discoverPRs(phase: string, slug: string): string[] {
  const analysisDir = join(ROOT, "data", "analysis");
  if (!existsSync(analysisDir)) return [];

  return readdirSync(analysisDir)
    .filter((d) => /^\d+$/.test(d))
    .filter((pr) => {
      const prDir = join(analysisDir, pr);
      if (!existsSync(join(prDir, "issue.md"))) return false;
      if (!existsSync(join(prDir, "metadata.json"))) return false;

      const expDir = findExperimentDir(pr, slug);

      if (phase === "analyze" || phase === "both") {
        if (!expDir) return true;
        return !existsSync(join(prDir, expDir, "proposed-fix.md"));
      }
      if (phase === "validate") {
        if (!expDir) return false;
        return (
          existsSync(join(prDir, expDir, "proposed-fix.md")) &&
          !existsSync(join(prDir, expDir, "validation.md"))
        );
      }
      return true;
    })
    .sort((a, b) => Number(a) - Number(b));
}

// ---------------------------------------------------------------------------
// Agent runner
// ---------------------------------------------------------------------------

interface RunResult {
  pr: string;
  agent: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

interface OtelConfig {
  otlpEndpoint?: string;
  filePath?: string;
}

async function runAgent(
  agentName: string,
  pr: string,
  model: string,
  otelConfig?: OtelConfig,
  verbose?: boolean,
): Promise<RunResult> {
  const start = Date.now();
  const isAnalyzer = agentName === "bug-analyzer";
  const emoji = isAnalyzer ? "🔬" : "🔍";
  const label = isAnalyzer ? "Analyzing" : "Validating";
  console.log(`${emoji} ${label} PR #${pr} …`);

  // Build telemetry config for the CLI process
  const telemetry = otelConfig?.otlpEndpoint
    ? {
        otlpEndpoint: otelConfig.otlpEndpoint,
        sourceName: "sounds-gucci",
        captureContent: true,
      }
    : otelConfig?.filePath
      ? {
          filePath: otelConfig.filePath,
          sourceName: "sounds-gucci",
          captureContent: true,
        }
      : undefined;

  // Each PR gets its own CopilotClient (= its own CLI process) for isolation.
  const client = new CopilotClient({ telemetry });

  try {
    const agentPrompt = readAgentPrompt(agentName);

    const session = await client.createSession({
      model,
      onPermissionRequest: approveAll,
      streaming: verbose,
      customAgents: [
        {
          name: agentName,
          displayName: isAnalyzer ? "Bug Analyzer" : "Fix Validator",
          description: isAnalyzer
            ? "Analyze a bug issue and propose a fix by examining git history"
            : "Compare a proposed bug fix against the actual PR changes",
          prompt: agentPrompt,
          infer: false,
        },
      ],
      agent: agentName,
    });

    // Stream assistant output when verbose
    if (verbose) {
      session.on("assistant.message_delta", (event) => {
        process.stdout.write(event.data.deltaContent);
      });
    }

    const timeout = isAnalyzer ? 900_000 : 600_000; // 15 min / 10 min
    const prompt = isAnalyzer
      ? `Analyze the bug in data/analysis/${pr}`
      : `Validate the fix proposal in data/analysis/${pr}`;

    await session.sendAndWait({ prompt }, timeout);
    await session.disconnect();

    const ms = Date.now() - start;
    console.log(`  ✅ PR #${pr} done (${(ms / 1000).toFixed(1)}s)`);
    return { pr, agent: agentName, success: true, durationMs: ms };
  } catch (err: any) {
    const ms = Date.now() - start;
    console.error(`  ❌ PR #${pr} failed (${(ms / 1000).toFixed(1)}s): ${err.message}`);
    return { pr, agent: agentName, success: false, error: err.message, durationMs: ms };
  } finally {
    await client.stop().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Model listing
// ---------------------------------------------------------------------------

async function listModels(): Promise<void> {
  const client = new CopilotClient();
  try {
    await client.start();
    const models = await client.listModels();

    console.log("\n📋 Available Models\n");
    console.log(
      "ID".padEnd(32) +
        "Name".padEnd(32) +
        "Context".padEnd(10) +
        "Vision".padEnd(8) +
        "Reasoning".padEnd(10) +
        "Multiplier",
    );
    console.log("─".repeat(110));

    for (const m of models) {
      const enabled = m.policy?.state !== "disabled";
      if (!enabled) continue;
      const ctx = m.capabilities?.limits?.max_context_window_tokens;
      const ctxStr = ctx ? `${Math.round(ctx / 1024)}k` : "—";
      const vision = m.capabilities?.supports?.vision ? "✓" : "";
      const reasoning = m.capabilities?.supports?.reasoningEffort ? "✓" : "";
      const mult = m.billing?.multiplier != null ? `${m.billing.multiplier}×` : "—";
      console.log(
        m.id.padEnd(32) +
          m.name.padEnd(32) +
          ctxStr.padEnd(10) +
          vision.padEnd(8) +
          reasoning.padEnd(10) +
          mult,
      );
    }
    console.log();
  } finally {
    await client.stop().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      prs:              { type: "string",  short: "p" },
      phase:            { type: "string",  default: "both" },
      model:            { type: "string",  short: "m" },
      slug:             { type: "string",  short: "s" },
      "otel-endpoint":  { type: "string" },
      "otel-file":      { type: "string" },
      concurrency:      { type: "string",  short: "c", default: "3" },
      verbose:          { type: "boolean", short: "v", default: false },
      "dry-run":        { type: "boolean", default: false },
      "list-models":    { type: "boolean", default: false },
      help:             { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(`
Usage: npx tsx scripts/run-analysis.ts [options]

Options:
  -p, --prs <list>          Comma-separated PR numbers (auto-discover if omitted)
  -m, --model <id>          Model ID for the Copilot SDK (default: read from .model)
  -s, --slug <name>         Experiment slug for output dirs (default: read from .model)
      --phase <phase>       "analyze", "validate", or "both" (default: "both")
  -c, --concurrency <n>     Max parallel validators (default: 3)
      --otel-endpoint <url> OTLP HTTP endpoint (e.g. http://localhost:4318)
      --otel-file <path>    File path for JSONL trace output
  -v, --verbose             Stream agent output to stdout
      --dry-run             Show config and exit without running
      --list-models         List available models and exit
  -h, --help                Show this help message
`);
    return;
  }

  if (values["list-models"]) {
    await listModels();
    return;
  }

  // --- Resolve configuration ---

  const currentSlug = readDotModel();
  const slug = values.slug || currentSlug;
  const model = values.model || slug;
  const phase = values.phase || "both";
  const concurrency = parseInt(values.concurrency || "3", 10);
  const verbose = values.verbose ?? false;
  const dryRun = values["dry-run"] ?? false;

  const otelConfig: OtelConfig | undefined =
    values["otel-endpoint"] || values["otel-file"]
      ? { otlpEndpoint: values["otel-endpoint"], filePath: values["otel-file"] }
      : undefined;

  // Sync .model file so the agent prompt picks up the right slug
  if (slug !== currentSlug) {
    writeDotModel(slug);
    console.log(`📝 Updated .model: ${currentSlug} → ${slug}`);
  }

  // --- Determine PRs ---

  let prs: string[];
  if (values.prs) {
    prs = values.prs.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    prs = discoverPRs(phase, slug);
  }

  // --- Print run configuration ---

  console.log(`
🚀 Analysis Pipeline
   Model:       ${model}
   Slug:        ${slug}
   Phase:       ${phase}
   PRs:         ${prs.length}${prs.length > 0 ? ` (${prs.slice(0, 8).join(", ")}${prs.length > 8 ? ", …" : ""})` : ""}
   Concurrency: ${concurrency} (validate phase)
   Telemetry:   ${otelConfig?.otlpEndpoint || otelConfig?.filePath || "off"}
   Verbose:     ${verbose}
`);

  if (prs.length === 0) {
    console.log(`✨ Nothing to do — all PRs are up to date for slug "${slug}".`);
    return;
  }

  if (dryRun) {
    console.log(`🏁 Dry run — would process: ${prs.join(", ")}`);
    return;
  }

  // --- Run phases ---

  const results: RunResult[] = [];

  // Phase 1: Bug analysis (sequential — agents share CLONE_PATH)
  if (phase === "analyze" || phase === "both") {
    console.log("━━━ Phase 1: Bug Analysis (sequential) ━━━\n");
    for (const pr of prs) {
      results.push(await runAgent("bug-analyzer", pr, model, otelConfig, verbose));
    }
  }

  // Phase 2: Fix validation (parallel with concurrency cap)
  if (phase === "validate" || phase === "both") {
    console.log(`\n━━━ Phase 2: Fix Validation (concurrency: ${concurrency}) ━━━\n`);

    // Re-discover if running "both" — some PRs may have failed analysis
    const validatePRs =
      phase === "both"
        ? prs.filter((pr) => results.some((r) => r.pr === pr && r.agent === "bug-analyzer" && r.success))
        : prs;

    for (let i = 0; i < validatePRs.length; i += concurrency) {
      const chunk = validatePRs.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((pr) => runAgent("fix-validator", pr, model, otelConfig, verbose)),
      );
      results.push(...chunkResults);
    }
  }

  // --- Summary ---

  const analyzeResults = results.filter((r) => r.agent === "bug-analyzer");
  const validateResults = results.filter((r) => r.agent === "fix-validator");
  const failed = results.filter((r) => !r.success);
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`
━━━ Summary ━━━
   Analyzed:  ${analyzeResults.filter((r) => r.success).length}/${analyzeResults.length}
   Validated: ${validateResults.filter((r) => r.success).length}/${validateResults.length}
   Total:     ${(totalMs / 1000 / 60).toFixed(1)} minutes`);

  if (failed.length > 0) {
    console.log(`\n   Failed:`);
    for (const r of failed) {
      console.log(`     - PR #${r.pr} (${r.agent}): ${r.error}`);
    }
  }

  console.log(`
💡 Next steps:
   bash scripts/generate-index.sh   # Rebuild dashboard
   git add -A && git commit          # Commit results
`);

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
