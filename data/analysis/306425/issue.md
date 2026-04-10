# Issue #306425: Sessions filtering not in sync with whats shown: show all vs recent

**Repository:** microsoft/vscode
**Author:** @bpasero
**Created:** 2026-03-30T18:20:32Z
**Labels:** bug, agents-app

## Description

<img width="660" height="801" alt="Image" src="https://github.com/user-attachments/assets/a0140ada-2e17-4ddc-9ca0-5b746fdf2a28" />

Even though all sessions should show according to the filter, only recent ones show.

## Comments


### @deepak1556 (2026-04-06T11:06:06Z)

Not sure if I am missing a step, but Show All vs Recent looks the same for me on latest insiders

```
Version: 1.115.0-insider
Commit: 6c8fcf1806fc53b1a1fb8863973ac55842edeb05
Date: 2026-04-06T02:44:23Z
Electron: 39.8.5
ElectronBuildId: 13703022
Chromium: 142.0.7444.265
Node.js: 22.22.1
V8: 14.2.231.22-electron.0
OS: Darwin arm64 25.4.0
```

https://github.com/user-attachments/assets/3e98750b-6eaa-48ea-aa2b-b4cf08f3905d

---

### @sandy081 (2026-04-07T10:56:22Z)

You should have at least 6 sessions to see the difference. Enable Cloud filter and try again.

---
