# Fix Validation: PR #294001

## Actual Fix Summary

The PR fixes the telemetry `[UriError]: Scheme contains illegal characters` on the logger IPC path by normalizing what `LoggerChannelClient#deregisterLogger` sends to the main process, enriching URI validation errors for easier diagnosis, and adding internal guidance (prompt + skill) for future error-telemetry fixes.

### Files Changed

- `src/vs/platform/log/common/logIpc.ts` — `deregisterLogger` now accepts `URI | string`, converts via `this.toResource(idOrResource)` before `super.deregisterLogger` and `channel.call('deregisterLogger', ...)`.
- `src/vs/base/common/uri.ts` — `_validateUri` throws a more detailed message when the scheme is invalid (first bad character, index, count, length).
- `.github/prompts/fix-error.prompt.md` — new agent prompt for telemetry-driven fixes.
- `.github/skills/fix-errors/SKILL.md` — skill documenting trace-the-producer vs fix-at-crash-site patterns.

### Approach

Fix at the **client API boundary** for deregistration (`toResource` on `URI | string`) so every caller path sends a consistent `URI` over IPC, plus **telemetry-friendly** detail in `uri.ts` (without changing validation rules). Process/docs additions are ancillary to the runtime fix.

## Proposal Comparison

### Files Overlap

| Proposal | Actual | Match |
|----------|--------|-------|
| `src/vs/platform/log/common/logIpc.ts` | `src/vs/platform/log/common/logIpc.ts` | ✅ (same primary target) |
| — | `src/vs/base/common/uri.ts` | ❌ (missed; proposal only mentioned optional main-side guard) |
| — | `.github/prompts/fix-error.prompt.md` | ❌ |
| — | `.github/skills/fix-errors/SKILL.md` | ❌ |

**Overlap Score:** 1/4 files (25%) by strict path count; functionally the proposal focused on the one file that carries the core behavioral fix.

### Root Cause Analysis

- **Proposal's root cause:** Marshalled logger resources on the **removed** branch of `onDidChangeLoggers` were not `URI.revive`’d (unlike **added**), so `deregisterLogger` forwarded shapes that broke `URI.revive` on the main logger channel.
- **Actual root cause:** Invalid or inconsistent **resource/id representation** when calling `LoggerChannelClient#deregisterLogger` (addressed by normalizing `URI | string` with `toResource` before IPC); plus better diagnostics where validation fails.
- **Assessment:** ⚠️ Partially correct — same subsystem (`logIpc.ts`, deregister IPC, invalid URI on main), but the proposal pinned the bug to a **specific event-branch asymmetry** while the shipped fix **centralizes normalization** in `deregisterLogger` and does not edit the `onDidChangeLoggers` handler in the diff.

### Approach Comparison

- **Proposal's approach:** Call `URI.revive(loggerResource.resource)` in the `removed` loops for `LoggerChannelClient` and `RemoteLoggerChannelClient`.
- **Actual approach:** Widen `deregisterLogger` to `URI | string` and always run `toResource`; enrich `uri.ts` errors; add repo guidance files.
- **Assessment:** Same high-level goal (valid `URI` before main-side revive), **different hook point** (listener vs method). The proposal did not mention `string` inputs or `toResource`, and did not propose `uri.ts` messaging changes.

## Alignment Score: 3/5 (Partial)

## Detailed Feedback

### What the proposal got right

- Identified **`src/vs/platform/log/common/logIpc.ts`** as the right place to fix the logger IPC client side of the failure.
- Correctly tied the crash to **`deregisterLogger` / URI handling** and the need to avoid sending malformed resource data to the main process.
- A revive/normalize step before IPC is **conceptually aligned** with ensuring the main handler receives a proper `URI`, even though the exact edit location differs from the PR.
- The proposed listener-side `URI.revive` could still **address the same failure mode** if the payload was unmarshalled `UriComponents`, but it does not mirror the PR’s **`URI | string` + `toResource`** fix and may not cover every caller shape the merge commit handled.

### What the proposal missed

- **`deregisterLogger` signature and `toResource`** — the actual fix generalizes all call sites instead of only the `removed` listener branch.
- **`src/vs/base/common/uri.ts` diagnostic enrichment** — useful for the next telemetry cycle; not part of the proposal’s recommended Option A.
- **New `.github` prompt/skill** — process/documentation scope not anticipated by the analyzer.

### What the proposal got wrong

- Nothing egregious: Option B (guards at crash site on main) was explicitly de-prioritized vs Option A, which matches the repo’s stated preference in the new skill, but the **actual** change still touched `uri.ts` for **richer errors**, not for swallowing failures.

## Recommendations for Improvement

- After locating a suspect IPC path, also inspect the **public methods** that forward to `channel.call` for a single place to normalize **all** representations (`URI`, `UriComponents`, `string` ids) via existing helpers like `toResource`.
- For high-volume telemetry errors, consider whether the **validation throw site** should include safe, truncated detail (as in the actual `uri.ts` change) without changing validation semantics.
