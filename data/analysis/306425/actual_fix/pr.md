# PR #306435: sessions: fix Show All Sessions filter out of sync with view on reload

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `39a50d8d3f4cb82f8d23f6ed762d8feda0a8032f`
**Parent Commit:** `2924b6cf31bca9a2296af760209a088907def726`

## Description

Fixes - https://github.com/microsoft/vscode/issues/306425

## Problem

After reloading, the **Show All Sessions** menu checkmark was always checked (✓), even when the user had previously selected "Show Recent Sessions". The view itself would be correct (showing the persisted filter), but the menu checkmark was out of sync.

## Root cause

`IsWorkspaceGroupCappedContext` — the context key that drives the menu checkmarks — was never initialized from persisted storage on reload. It defaulted to `true` (the `RawContextKey` default), which made "Show All Sessions" always appear checked regardless of the stored value.

There was also a secondary issue: the **Reset** action called `sessionsControl.resetFilters()` (which resets `workspaceGroupCapped` to `true` internally and persists it) but did not update the context key accordingly.

## Fix

1. **Bind the context key** in the `SessionsView` constructor alongside the other context keys (`groupingContextKey`, `sortingContextKey`).
2. **Sync it from persisted state** in `renderBody` after `SessionsList` is created, using `sessionsControl.isWorkspaceGroupCapped()`.
3. **Reset it in the Reset action** — capture the context key as a closure variable and set it to `true` when filters are reset.

## Commits

- sessions: fix Show All Sessions filter out of sync with view on reload
- use sessionsControl as source of truth for reset context key

## Changed Files

- src/vs/sessions/contrib/sessions/browser/views/sessionsView.ts
