# Issue #304614: Default to the settings gear upgrade flow if nav bar is disabled

**Repository:** microsoft/vscode
**Author:** @cwebster-99
**Created:** 2026-03-25T00:33:57Z
**Labels:** bug, verified

## Description

For users that may have the title bar disabled / hidden we need a fallback flow to prompt them to upgrade. We should default to the current experience showing the badge on the settings gear icon. 

As a result we will have the main title bar flow (99% users) and fallback on setting gear icon (1%). Users who get the fallback experience should still be able to see the post upgrade widget with "what's new"


As a result we could rip out the status bar implementation and setting 

![Image](https://github.com/user-attachments/assets/12b7a828-7162-4972-be00-9202b5bf10cc)

## Comments


### @dmitrivMS (2026-03-31T20:32:07Z)

Fixed in https://github.com/microsoft/vscode/pull/306251

---
