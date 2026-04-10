# PR #305270: fix accessibility issues with action list, specifically `Other Models` action list

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `4cdcd4f3451602ebd0cc109b2186ae497f1dbe81`
**Parent Commit:** `5a3846c8cec217176fb72e816898e76696eea1f2`

## Description

fix #302212

Enter didn't work because section toggling only happened in the mouse click handler (`onListClick`). The keyboard path (`onListSelection`) just cleared the selection and returned. The fix moves the toggle into `onListSelection`, which fires for both mouse and keyboard, and removes the duplicate from `onListClick`.

For screen readers, section toggles now get `aria-expanded` and role `menuitem` (instead of `menuitemradio`).

## Commits

- fix #302212
- tweak
- simplify
- Merge branch 'main' into merogge/fix-other-models

## Changed Files

- src/vs/platform/actionWidget/browser/actionList.ts
- src/vs/workbench/contrib/chat/browser/widget/input/chatModelPicker.ts
