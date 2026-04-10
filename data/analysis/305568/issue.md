# Issue #305568: Sessions goes black on Reload

**Repository:** microsoft/vscode
**Author:** @joaomoreno
**Created:** 2026-03-27T09:04:37Z
**Labels:** bug, verified, themes, insiders-released, agents-app

## Description

1. Open Sessions
2. `Reload Window`

🐛 The window contents flicker black

https://github.com/user-attachments/assets/421d4d56-ba49-45d0-8b4c-2bb06eda322b

## Comments


### @bpasero (2026-03-31T12:50:28Z)

This might be some issue with storing the base theme on the main side and restoring it, considering you use a light theme.

---
