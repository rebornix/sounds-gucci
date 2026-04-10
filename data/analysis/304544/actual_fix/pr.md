# PR #306454: sessions: fix welcome page chat input collapsing on first keystroke

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `4ebc211cda9e32010ab4770859156e9a95583559`
**Parent Commit:** `abea71e2b7c1daecf68232d5d2a96efe3a6bc7f0`

## Description

Fixes: https://github.com/microsoft/vscode/issues/304544
## Problem

Typing in the Agent Sessions welcome page chat input causes the box to collapse so text is not visible (issue #304544). The editor shrinks from ~44px to ~22px after the first keystroke.

## Root Cause

`ChatWidget.layout()` reserves `MIN_LIST_HEIGHT` (50px) for the chat list even when the welcome page hides it via CSS (`display: none !important`). With a layout height of 150px, only 100px remained for the input part. Once the input part's non-editor chrome (~128px for toolbars, padding, attachments area) was subtracted, `_effectiveInputEditorMaxHeight` dropped to **0**, collapsing the editor completely.

## Fix

Call `setInputPartMaxHeightOverride(272)` before `layout()` so the input part has enough height budget independent of the artificially small layout height. This mirrors what other compact chat surfaces (e.g. stacked chat view in `chatViewPane.ts`) already do.

The override value (272) is chosen to be: `150 (layout height) + 50 (MIN_LIST_HEIGHT) + 72 (buffer for chrome growth)`.

Fixes #304544

## Commits

- sessions: fix welcome page chat input collapsing on first keystroke
- sessions: clarify welcome chat height override math

## Changed Files

- src/vs/workbench/contrib/welcomeAgentSessions/browser/agentSessionsWelcome.ts
