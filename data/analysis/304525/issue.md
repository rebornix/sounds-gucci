# Issue #304525: Cannot close "no update available" dialog with escape

**Repository:** microsoft/vscode
**Author:** @amunger
**Created:** 2026-03-24T17:21:20Z
**Labels:** bug, verified, install-update, insiders-released

## Description

Steps to Reproduce:

1. while on the latest insiders, run "check for update" command
2. popup appears saying no update available
3. press esc to close

🐛 does not close, needs to be focused first

## Comments


### @dmitrivMS (2026-03-30T04:39:23Z)

Will show a modal dialog as before instead of the tooltip.

---
