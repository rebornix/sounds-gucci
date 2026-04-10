# PR #304938: docs: add error construction analysis guidance to fix-errors skill and prompt

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `ddc44da46fc929cab661c9a1839c2596e922f4a3`
**Parent Commit:** `84f7ab5aa01c31d5352c7db89051e8c391fd9ae1`

## Description

## Summary

Teach the fix-error workflow to **read error construction code** before proposing fixes. Instead of hardcoding knowledge about specific error types, the AI is instructed to:

1. Search for where the error is constructed in the codebase
2. Read the surrounding code to understand conditions, categories, thresholds
3. Use that understanding to determine the correct fix strategy

This is a generic approach that works for all error types and stays correct when implementation details change. Includes a listener leak example showing how reading `ListenerLeakError` construction in `event.ts` reveals the dominated/popular classification (using `> 0.3`) and the correct action for each.

No code changes — purely documentation (skill + prompt updates).

Relates to #289777

## Changed Files

- **[.github/skills/fix-errors/SKILL.md](.github/skills/fix-errors/SKILL.md)**: Added 'Understanding error construction before fixing' section with generic guidance and a concrete listener leak example derived from reading the construction code. Thresholds match the actual code (`> 0.3`).
- **[.github/prompts/fix-error.prompt.md](.github/prompts/fix-error.prompt.md)**: Replaced hardcoded listener leak triage step with generic step 1: 'Read the error construction code first' — instructing to find the `new Error(...)` site, understand its conditions/categories, and use that to determine fix strategy.

## Commits

- docs: add error construction analysis guidance to fix-errors skill an…

## Changed Files

- .github/prompts/fix-error.prompt.md
- .github/skills/fix-errors/SKILL.md
