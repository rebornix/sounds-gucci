# Issue #289777: [Unhandled Error] [172] potential listener LEAK detected, having 184 listeners already. MOST frequent listener (4):

**Repository:** microsoft/vscode
**Author:** @bryanchen-d
**Created:** 2026-01-22T22:50:37Z
**Labels:** bug, error-telemetry

## Description

Issue created from VS Code Errors Analysis Dashboard

## Error Bucket
`c6d54e1f-06a1-56b7-0a9b-e8dbcbbe14a8`

## Error Message
```
[172] potential listener LEAK detected, having 184 listeners already. MOST frequent listener (4):
```

## Stack Trace
```
    at n5i.create (./src/vs/base/common/event.ts:935:14)
    at jWe.u [as onDidChange] (./src/vs/base/common/event.ts:1120:33)
    at Object.h [as onWillAddFirstListener] (./src/vs/platform/actions/common/menuService.ts:437:33)
    at ffe.u [as onDidChange] (./src/vs/base/common/event.ts:1129:44)
    at new lr (./src/vs/platform/actions/browser/toolbar.ts:377:23)
    at NRt.o (./src/vs/platform/instantiation/common/instantiationService.ts:162:17)
    at NRt.createInstance (./src/vs/platform/instantiation/common/instantiationService.ts:128:17)
    at new Q_ (./src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingCodeEditorIntegration.ts:743:31)
    at NRt.o (./src/vs/platform/instantiation/common/instantiationService.ts:162:17)
    at NRt.createInstance (./src/vs/platform/instantiation/common/instantiationService.ts:128:17)
```

<details>
<summary>Raw Stack Trace (minified)</summary>

```
Error     at n5i.create (out/vs/workbench/workbench.desktop.main.js:27:12074)     at jWe.u [as onDidChange] (out/vs/workbench/workbench.desktop.main.js:29:1377)     at Object.h [as onWillAddFirstListener] (out/vs/workbench/workbench.desktop.main.js:427:119612)     at ffe.u [as onDidChange] (out/vs/workbench/workbench.desktop.main.js:29:1565)     at new lr (out/vs/workbench/workbench.desktop.main.js:427:124390)     at NRt.o (out/vs/workbench/workbench.desktop.main.js:1406:1580)     at NRt.createInstance (out/vs/workbench/workbench.desktop.main.js:1406:1077)     at new Q_ (out/vs/workbench/workbench.desktop.main.js:2246:67132)     at NRt.o (out/vs/workbench/workbench.desktop.main.js:1406:1580)     at NRt.createInstance (out/vs/workbench/workbench.desktop.main.js:1406:1077)
```
</details>

## Details
| Property | Value |
| --- | --- |
| Version | 1.108.1 |
| Commit | [585eba7c](https://github.com/microsoft/vscode/commit/585eba7c0c34fd6b30faac7c62a42050bfbc0086) |
| Last Seen | 2026-01-21T23:59:44.336Z |
| Total Hits | 8.8M |
| Affected Users | 249.4K |
| Platforms | Linux, Mac, Windows |
| Product | VSCode |

---
*This issue was automatically created from the VS Code Errors Dashboard*

## Comments


### @bryanchen-d (2026-03-25T22:04:32Z)

Closing after investigation. The error reports 184 total listeners with the pool's widget creation being the most frequent stack trace at only 4 occurrences (4/184 = ~2%). The pool is not the root cause — it's just the most *identical* stack trace among ~180 diverse menu listeners across the workbench. Removing the pool would reintroduce Keep/Undo blinking (#274223) without fixing the listener count. The recent classification in 95b003130c5 correctly labels this as a 'popular' (not 'dominated') leak. The threshold is being hit by the aggregate of all menu listeners in the workbench, not by this specific code path.

---
