# PR #306251: Update UI bug fixes and improvements

**Repository:** microsoft/vscode
**Labels:** install-update
**Merge Commit:** `00356ebc69d09b93830f05eb4eabf872d425abdd`
**Parent Commit:** `4003d390fb8747be92b4e66c280584cf92579d16`

## Description

Fixed various update UI bugs.
Made the title bar UI default.
Removed status bar UI.
Removed some legacy UI.

Fixes #304525
Fixes #304382
Fixes #304111
Fixes #304012
Fixes #303222
Fixes #302379
Fixes #302054
Fixes #283924

## Commits

- Update test command
- Remove update button from release notes
- Fix Update button layout
- Remove update status bar entry
- Update bug fixes and improvements
- Merge branch 'main' into dev/dmitriv/update-bug-fixes
- PR feedback

## Changed Files

- src/vs/platform/update/common/update.config.contribution.ts
- src/vs/platform/update/common/update.ts
- src/vs/platform/update/electron-main/abstractUpdateService.ts
- src/vs/platform/update/electron-main/updateService.win32.ts
- src/vs/sessions/contrib/accountMenu/test/browser/accountWidget.fixture.ts
- src/vs/sessions/contrib/accountMenu/test/browser/updateHoverWidget.fixture.ts
- src/vs/workbench/browser/parts/titlebar/media/titlebarpart.css
- src/vs/workbench/contrib/update/browser/media/updateStatusBarEntry.css
- src/vs/workbench/contrib/update/browser/media/updateTitleBarEntry.css
- src/vs/workbench/contrib/update/browser/media/updateTooltip.css
- src/vs/workbench/contrib/update/browser/releaseNotesEditor.ts
- src/vs/workbench/contrib/update/browser/update.contribution.ts
- src/vs/workbench/contrib/update/browser/update.ts
- src/vs/workbench/contrib/update/browser/updateStatusBarEntry.ts
- src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts
- src/vs/workbench/contrib/update/browser/updateTooltip.ts
