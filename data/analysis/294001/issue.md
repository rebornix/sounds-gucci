# Issue #293503: [Unhandled Error] [UriError]: Scheme contains illegal characters.

**Repository:** microsoft/vscode
**Author:** @bryanchen-d
**Created:** 2026-02-06T18:24:11Z
**Labels:** bug, error-telemetry, insiders-released

## Description

Issue created from VS Code Errors Analysis Dashboard

## Error Bucket
`97e4fdf2-3af5-214a-268e-0f505cbf92ef`

## Error Message
```
[UriError]: Scheme contains illegal characters.
```

## Stack Trace
```
    at q8 (./src/vs/base/common/uri.ts:25:8)
    at _validateUri (./src/vs/base/common/uri.ts:175:3)
    at new Zr (./src/vs/base/common/uri.ts:451:0)
    at Dd.revive (./src/vs/base/common/uri.ts:410:18)
    at i9.call (./src/vs/platform/log/electron-main/logIpc.ts:36:75)
    at Xf.s (./src/vs/base/parts/ipc/common/ipc.ts:419:21)
    at Xf.q (./src/vs/base/parts/ipc/common/ipc.ts:394:16)
    at ca.value (./src/vs/base/parts/ipc/common/ipc.ts:338:62)
    at D.C (./src/vs/base/common/event.ts:1295:12)
    at D (./src/vs/base/common/event.ts:1306:8)
    at D.fire (./src/vs/base/common/event.ts:1330:8)
    at ca.value (./src/vs/base/common/event.ts:134:83)
    at D.C (./src/vs/base/common/event.ts:1295:12)
    at D.fire (./src/vs/base/common/event.ts:1326:8)
    at ca.value (./src/vs/base/common/event.ts:168:96)
    at D.C (./src/vs/base/common/event.ts:1295:12)
    at D.fire (./src/vs/base/common/event.ts:1326:8)
    at N (./src/vs/base/common/event.ts:667:40)
    at listener (./src/vs/base/parts/ipc/electron-main/ipcMain.ts:30:4)
    at IpcMainImpl.emit (node:events:531:35)
    at Session.<anonymous> (node:<REDACTED: user-file-path>:2:106626)
    at Session.emit (node:events:519:28)
```

<details>
<summary>Raw Stack Trace (minified)</summary>

```
Error: [UriError]: Scheme contains illegal characters.     at q8 (out/main.js:30:64426)     at new Dd (out/main.js:30:67806)     at new Zr (out/main.js:30:69244)     at Dd.revive (out/main.js:30:69021)     at i9.call (out/main.js:92:107904)     at Xf.s (out/main.js:31:14894)     at Xf.q (out/main.js:31:14417)     at ca.value (out/main.js:31:13819)     at D.C (out/main.js:30:2328)     at D (out/main.js:30:2398)     at D.fire (out/main.js:30:2615)     at ca.value (out/main.js:28:5390)     at D.C (out/main.js:30:2328)     at D.fire (out/main.js:30:2546)     at ca.value (out/main.js:28:5574)     at D.C (out/main.js:30:2328)     at D.fire (out/main.js:30:2546)     at N (out/main.js:28:8307)     at IpcMainImpl.i (out/main.js:36:10846)     at IpcMainImpl.emit (node:events:531:35)     at Session.<anonymous> (node:<REDACTED: user-file-path>:2:106626)     at Session.emit (node:events:519:28)
```
</details>

## Details
| Property | Value |
| --- | --- |
| Version | 1.109.0 |
| Commit | [bdd88df0](https://github.com/microsoft/vscode/commit/bdd88df003631aaa0bcbe057cb0a940b80a476fa) |
| Last Seen | 2026-02-05T23:59:54.288Z |
| Total Hits | 1.4M |
| Affected Users | 566.8K |
| Platforms | Linux, Mac, Windows |
| Product | VSCode |

---
*This issue was automatically created from the VS Code Errors Dashboard*

## Comments

