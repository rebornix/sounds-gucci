# PR #304979: fix: persist test coverage sort order across sessions

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `6e1bad2b04f91c3b5767035edfd0ab1ee3c20228`
**Parent Commit:** `e8e47a0d96a8efaee80c31a67412a848f3e2507d`

## Description

## What kind of change does this PR introduce?

Bug fix

## What is the current behavior?

The Test Coverage view's sort order resets to "Sort by Location" every time the view is reopened (e.g., after running tests without coverage and then re-running with coverage). The sort order selection is not persisted.

Closes #249442

## What is the new behavior?

The sort order is now persisted to workspace storage using `IStorageService`. When the Test Coverage view is created, it reads the previously stored sort order. An `autorun` watcher saves the sort order to storage whenever it changes.

## Additional context

Single file change: `src/vs/workbench/contrib/testing/browser/testCoverageView.ts`

- Added `IStorageService` injection
- Load stored sort order in constructor
- Persist sort order changes via `autorun` in `renderBody`
- Storage key: `testing.coverageSortOrder` (workspace scope, machine target)

TypeScript compilation passes with no errors.

## Commits

- fix: persist test coverage sort order across sessions
- fix: correct const enum validation in coverage sort persistence

## Changed Files

- src/vs/workbench/contrib/testing/browser/testCoverageView.ts
