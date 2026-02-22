# Issue #293365: [Unhandled Error] Cannot read properties of undefined (reading 'getViewLineMinColumn')

**Repository:** microsoft/vscode
**Author:** @alexr00
**Created:** 2026-02-06T10:23:39Z
**Labels:** bug, important, error-telemetry, unreleased

## Description

Issue created from VS Code Errors Analysis Dashboard

## Error Bucket
`d9c52b73-3aa8-b5a3-7e48-691cde2befde`

## Error Message
```
Cannot read properties of undefined (reading 'getViewLineMinColumn')
```

## Stack Trace
```
TypeError: Cannot read properties of undefined (reading 'getViewLineMinColumn')
    at ncs.getViewLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:45363)
    at hcs.getLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:66535)
    at hcs.C (out/vs/workbench/workbench.desktop.main.js:300:56132)
    at hcs.F (out/vs/workbench/workbench.desktop.main.js:300:56329)
    at out/vs/workbench/workbench.desktop.main.js:300:60149
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:289:29636)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at dls.endDeferredEmit (out/vs/workbench/workbench.desktop.main.js:299:18994)
    at xg.pushEditOperations (out/vs/workbench/workbench.desktop.main.js:297:509)
    at $fe.c (out/vs/workbench/workbench.desktop.main.js:300:4883)
    at $fe.executeCommands (out/vs/workbench/workbench.desktop.main.js:300:4383)
    at J9t.G (out/vs/workbench/workbench.desktop.main.js:299:41342)
    at out/vs/workbench/workbench.desktop.main.js:300:1718
    at J9t.L (out/vs/workbench/workbench.desktop.main.js:300:965)
    at J9t.type (out/vs/workbench/workbench.desktop.main.js:300:1618)
    at out/vs/workbench/workbench.desktop.main.js:301:2845
    at out/vs/workbench/workbench.desktop.main.js:301:3920
    at Object.batchChanges (out/vs/workbench/workbench.desktop.main.js:303:15801)
    at hcs.X (out/vs/workbench/workbench.desktop.main.js:301:3854)
    at hcs.W (out/vs/workbench/workbench.desktop.main.js:301:2636)
    at hcs.type (out/vs/workbench/workbench.desktop.main.js:301:2833)
    at cl.ac (out/vs/workbench/workbench.desktop.main.js:303:8240)
    at cl.trigger (out/vs/workbench/workbench.desktop.main.js:303:7398)
    at YBt.runCommand (out/vs/workbench/workbench.desktop.main.js:70:37529)
    at handler (out/vs/workbench/workbench.desktop.main.js:38:8145)
    at i.handler (out/vs/workbench/workbench.desktop.main.js:35:56439)
    at z$t.invokeFunction (out/vs/workbench/workbench.desktop.main.js:1412:674)
    at Mtt.n (out/vs/workbench/workbench.desktop.main.js:1354:3984)
    at Mtt.executeCommand (out/vs/workbench/workbench.desktop.main.js:1354:3599)
    at Object.type (out/vs/workbench/workbench.desktop.main.js:303:18245)
    at yNt.type (out/vs/workbench/workbench.desktop.main.js:110:13431)
    at ffe.S (out/vs/workbench/workbench.desktop.main.js:262:4378)
    at HTMLDivElement.<anonymous> (out/vs/workbench/workbench.desktop.main.js:261:6008)
```

## Details
| Property | Value |
| --- | --- |
| Version | 1.109.0 |
| Commit | [bdd88df0](https://github.com/microsoft/vscode/commit/bdd88df003631aaa0bcbe057cb0a940b80a476fa) |
| Last Seen | 2026-02-05T23:59:42.040Z |
| Total Hits | 674.0K |
| Affected Users | 54.5K |
| Platforms | Mac, Windows, Linux |
| Product | VSCode |

---
*This issue was automatically created from the VS Code Errors Dashboard*

## Comments


### @alexr00 (2026-02-06T10:26:28Z)

Also likely related to this one:
```
TypeError: Cannot read properties of undefined (reading 'getModelColumnOfViewPosition')
    at ncs.getViewLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:45363)
    at hcs.getLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:66535)
    at hcs.C (out/vs/workbench/workbench.desktop.main.js:300:56132)
    at hcs.F (out/vs/workbench/workbench.desktop.main.js:300:56329)
    at out/vs/workbench/workbench.desktop.main.js:300:60149
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:289:29636)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at dls.endDeferredEmit (out/vs/workbench/workbench.desktop.main.js:299:18994)
    at xg.pushEditOperations (out/vs/workbench/workbench.desktop.main.js:297:509)
    at $fe.c (out/vs/workbench/workbench.desktop.main.js:300:4883)
    at $fe.executeCommands (out/vs/workbench/workbench.desktop.main.js:300:4383)
    at J9t.G (out/vs/workbench/workbench.desktop.main.js:299:41342)
    at out/vs/workbench/workbench.desktop.main.js:300:1718
    at J9t.L (out/vs/workbench/workbench.desktop.main.js:300:965)
    at J9t.type (out/vs/workbench/workbench.desktop.main.js:300:1618)
    at out/vs/workbench/workbench.desktop.main.js:301:2845
    at out/vs/workbench/workbench.desktop.main.js:301:3920
    at Object.batchChanges (out/vs/workbench/workbench.desktop.main.js:303:15801)
    at hcs.X (out/vs/workbench/workbench.desktop.main.js:301:3854)
    at hcs.W (out/vs/workbench/workbench.desktop.main.js:301:2636)
    at hcs.type (out/vs/workbench/workbench.desktop.main.js:301:2833)
    at cl.ac (out/vs/workbench/workbench.desktop.main.js:303:8240)
    at cl.trigger (out/vs/workbench/workbench.desktop.main.js:303:7398)
    at YBt.runCommand (out/vs/workbench/workbench.desktop.main.js:70:37529)
    at handler (out/vs/workbench/workbench.desktop.main.js:38:8145)
    at i.handler (out/vs/workbench/workbench.desktop.main.js:35:56439)
    at z$t.invokeFunction (out/vs/workbench/workbench.desktop.main.js:1412:674)
    at Mtt.n (out/vs/workbench/workbench.desktop.main.js:1354:3984)
    at Mtt.executeCommand (out/vs/workbench/workbench.desktop.main.js:1354:3599)
    at Object.type (out/vs/workbench/workbench.desktop.main.js:303:18245)
    at yNt.type (out/vs/workbench/workbench.desktop.main.js:110:13431)
    at ffe.S (out/vs/workbench/workbench.desktop.main.js:262:4378)
    at HTMLDivElement.<anonymous> (out/vs/workbench/workbench.desktop.main.js:261:6008)
```

---

### @alexr00 (2026-02-06T10:27:03Z)

And this one:
```
TypeError: Cannot read properties of undefined (reading 'getViewLineMinColumn')
    at ncs.getViewLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:45363)
    at hcs.getLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:66535)
    at hcs.getCompletelyVisibleViewRange (out/vs/workbench/workbench.desktop.main.js:300:64675)
    at hcs.getVisibleRanges (out/vs/workbench/workbench.desktop.main.js:300:63974)
    at ju.getVisibleRanges (out/vs/workbench/workbench.desktop.main.js:303:751)
    at m4.f (out/vs/workbench/workbench.desktop.main.js:542:10786)
    at m4.readFromEditor (out/vs/workbench/workbench.desktop.main.js:542:10211)
    at wAs.p (out/vs/workbench/workbench.desktop.main.js:542:11887)
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:542:12521)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at out/vs/workbench/workbench.desktop.main.js:542:6670
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:289:29544)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at dls.endDeferredEmit (out/vs/workbench/workbench.desktop.main.js:299:19009)
    at xg.pushEditOperations (out/vs/workbench/workbench.desktop.main.js:297:509)
    at $fe.c (out/vs/workbench/workbench.desktop.main.js:300:4883)
    at $fe.executeCommands (out/vs/workbench/workbench.desktop.main.js:300:4383)
    at J9t.G (out/vs/workbench/workbench.desktop.main.js:299:41342)
    at out/vs/workbench/workbench.desktop.main.js:300:2625
    at J9t.L (out/vs/workbench/workbench.desktop.main.js:300:965)
    at J9t.cut (out/vs/workbench/workbench.desktop.main.js:300:2613)
    at out/vs/workbench/workbench.desktop.main.js:301:3006
    at out/vs/workbench/workbench.desktop.main.js:301:3920
    at Object.batchChanges (out/vs/workbench/workbench.desktop.main.js:303:15801)
    at hcs.X (out/vs/workbench/workbench.desktop.main.js:301:3854)
    at hcs.W (out/vs/workbench/workbench.desktop.main.js:301:2636)
    at hcs.cut (out/vs/workbench/workbench.desktop.main.js:301:2994)
    at cl.dc (out/vs/workbench/workbench.desktop.main.js:303:8661)
    at cl.trigger (out/vs/workbench/workbench.desktop.main.js:303:7783)
    at Object.implementation (out/vs/workbench/workbench.desktop.main.js:434:220760)
    at qN.runCommand (out/vs/workbench/workbench.desktop.main.js:38:8929)
    at handler (out/vs/workbench/workbench.desktop.main.js:38:8145)
    at z$t.invokeFunction (out/vs/workbench/workbench.desktop.main.js:1412:674)
    at Mtt.n (out/vs/workbench/workbench.desktop.main.js:1354:3984)
    at Mtt.executeCommand (out/vs/workbench/workbench.desktop.main.js:1354:3599)
    at dse.N (out/vs/workbench/workbench.desktop.main.js:1332:16462)
    at dse.L (out/vs/workbench/workbench.desktop.main.js:1332:14144)
    at out/vs/workbench/workbench.desktop.main.js:1333:2521
```

---

### @alexr00 (2026-02-06T10:27:45Z)

And this one
```
TypeError: Cannot read properties of undefined (reading 'normalizePosition')
    at ncs.getViewLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:45363)
    at hcs.getLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:66535)
    at hcs.getCompletelyVisibleViewRange (out/vs/workbench/workbench.desktop.main.js:300:64675)
    at hcs.getVisibleRanges (out/vs/workbench/workbench.desktop.main.js:300:63974)
    at ju.getVisibleRanges (out/vs/workbench/workbench.desktop.main.js:303:751)
    at m4.f (out/vs/workbench/workbench.desktop.main.js:542:10786)
    at m4.readFromEditor (out/vs/workbench/workbench.desktop.main.js:542:10211)
    at wAs.p (out/vs/workbench/workbench.desktop.main.js:542:11887)
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:542:12521)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at out/vs/workbench/workbench.desktop.main.js:542:6670
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:289:29544)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at dls.endDeferredEmit (out/vs/workbench/workbench.desktop.main.js:299:19009)
    at xg.pushEditOperations (out/vs/workbench/workbench.desktop.main.js:297:509)
    at $fe.c (out/vs/workbench/workbench.desktop.main.js:300:4883)
    at $fe.executeCommands (out/vs/workbench/workbench.desktop.main.js:300:4383)
    at J9t.G (out/vs/workbench/workbench.desktop.main.js:299:41342)
    at out/vs/workbench/workbench.desktop.main.js:300:2625
    at J9t.L (out/vs/workbench/workbench.desktop.main.js:300:965)
    at J9t.cut (out/vs/workbench/workbench.desktop.main.js:300:2613)
    at out/vs/workbench/workbench.desktop.main.js:301:3006
    at out/vs/workbench/workbench.desktop.main.js:301:3920
    at Object.batchChanges (out/vs/workbench/workbench.desktop.main.js:303:15801)
    at hcs.X (out/vs/workbench/workbench.desktop.main.js:301:3854)
    at hcs.W (out/vs/workbench/workbench.desktop.main.js:301:2636)
    at hcs.cut (out/vs/workbench/workbench.desktop.main.js:301:2994)
    at cl.dc (out/vs/workbench/workbench.desktop.main.js:303:8661)
    at cl.trigger (out/vs/workbench/workbench.desktop.main.js:303:7783)
    at Object.implementation (out/vs/workbench/workbench.desktop.main.js:434:220760)
    at qN.runCommand (out/vs/workbench/workbench.desktop.main.js:38:8929)
    at handler (out/vs/workbench/workbench.desktop.main.js:38:8145)
    at z$t.invokeFunction (out/vs/workbench/workbench.desktop.main.js:1412:674)
    at Mtt.n (out/vs/workbench/workbench.desktop.main.js:1354:3984)
    at Mtt.executeCommand (out/vs/workbench/workbench.desktop.main.js:1354:3599)
    at dse.N (out/vs/workbench/workbench.desktop.main.js:1332:16462)
    at dse.L (out/vs/workbench/workbench.desktop.main.js:1332:14144)
    at out/vs/workbench/workbench.desktop.main.js:1333:2521
```

---

### @alexr00 (2026-02-06T10:28:10Z)

And this one:
```
TypeError: Cannot read properties of undefined (reading 'then')
    at ncs.getViewLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:45363)
    at hcs.getLineMinColumn (out/vs/workbench/workbench.desktop.main.js:300:66535)
    at hcs.getCompletelyVisibleViewRange (out/vs/workbench/workbench.desktop.main.js:300:64675)
    at hcs.getVisibleRanges (out/vs/workbench/workbench.desktop.main.js:300:63974)
    at ju.getVisibleRanges (out/vs/workbench/workbench.desktop.main.js:303:751)
    at m4.f (out/vs/workbench/workbench.desktop.main.js:542:10786)
    at m4.readFromEditor (out/vs/workbench/workbench.desktop.main.js:542:10211)
    at wAs.p (out/vs/workbench/workbench.desktop.main.js:542:11887)
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:542:12521)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at out/vs/workbench/workbench.desktop.main.js:542:6670
    at Fhe.value (out/vs/workbench/workbench.desktop.main.js:289:29544)
    at L.C (out/vs/workbench/workbench.desktop.main.js:29:2349)
    at L.D (out/vs/workbench/workbench.desktop.main.js:29:2419)
    at L.fire (out/vs/workbench/workbench.desktop.main.js:29:2637)
    at dls.endDeferredEmit (out/vs/workbench/workbench.desktop.main.js:299:19009)
    at xg.pushEditOperations (out/vs/workbench/workbench.desktop.main.js:297:509)
    at $fe.c (out/vs/workbench/workbench.desktop.main.js:300:4883)
    at $fe.executeCommands (out/vs/workbench/workbench.desktop.main.js:300:4383)
    at J9t.G (out/vs/workbench/workbench.desktop.main.js:299:41342)
    at out/vs/workbench/workbench.desktop.main.js:300:2625
    at J9t.L (out/vs/workbench/workbench.desktop.main.js:300:965)
    at J9t.cut (out/vs/workbench/workbench.desktop.main.js:300:2613)
    at out/vs/workbench/workbench.desktop.main.js:301:3006
    at out/vs/workbench/workbench.desktop.main.js:301:3920
    at Object.batchChanges (out/vs/workbench/workbench.desktop.main.js:303:15801)
    at hcs.X (out/vs/workbench/workbench.desktop.main.js:301:3854)
    at hcs.W (out/vs/workbench/workbench.desktop.main.js:301:2636)
    at hcs.cut (out/vs/workbench/workbench.desktop.main.js:301:2994)
    at cl.dc (out/vs/workbench/workbench.desktop.main.js:303:8661)
    at cl.trigger (out/vs/workbench/workbench.desktop.main.js:303:7783)
    at Object.implementation (out/vs/workbench/workbench.desktop.main.js:434:220760)
    at qN.runCommand (out/vs/workbench/workbench.desktop.main.js:38:8929)
    at handler (out/vs/workbench/workbench.desktop.main.js:38:8145)
    at z$t.invokeFunction (out/vs/workbench/workbench.desktop.main.js:1412:674)
    at Mtt.n (out/vs/workbench/workbench.desktop.main.js:1354:3984)
    at Mtt.executeCommand (out/vs/workbench/workbench.desktop.main.js:1354:3599)
    at dse.N (out/vs/workbench/workbench.desktop.main.js:1332:16462)
    at dse.L (out/vs/workbench/workbench.desktop.main.js:1332:14144)
    at out/vs/workbench/workbench.desktop.main.js:1333:2521
```

---

### @catskul (2026-02-06T18:55:58Z)

Seeing same issue.

Version: 1.110.0-insider (Universal)
Commit: 6764590f38bca9007e7bf94028708a8ddeee8927
Date: 2026-02-06T10:11:46.520Z (9 hrs ago)
Electron: 39.3.0
ElectronBuildId: 13168319
Chromium: 142.0.7444.265
Node.js: 22.21.1
V8: 14.2.231.22-electron.0
OS: Darwin arm64 25.2.0

---

### @pjm4 (2026-02-07T16:10:32Z)

fyi - when coding I've seen this a couple of times in the last few days. It appears to be breaking the undo feature of the editor. Actually, editor starts to act really weird where the cursor doesn't move when I press return. I've had to restart and to use the timeline to go back to previous versions of the code. Is there a work-around I can use? I guess to use the stable build for now. 

Version: 1.110.0-insider
Commit: c308cc9f87e1427a73c5e32c81a1cfe9b1b203d1
Date: 2026-02-06T17:10:19.395Z
Electron: 39.3.0
ElectronBuildId: 13168319
Chromium: 142.0.7444.265
Node.js: 22.21.1
V8: 14.2.231.22-electron.0
OS: Darwin arm64 25.2.0

---

### @langningchen (2026-02-12T01:05:44Z)

I've encountered this issue about 10 times in the past week.

It appears to be triggered by a conflict between GitHub Copilot's inline suggestions and manual editing. I am currently testing with GitHub Copilot disabled to see if the problem persists and will report back.

```
Version: 1.110.0-insider (user setup)
Commit: c600be49daf9167f9757b51670f12151d8621855
Date: 2026-02-11T17:06:04.989Z
Electron: 39.3.0
ElectronBuildId: 13168319
Chromium: 142.0.7444.265
Node.js: 22.21.1
V8: 14.2.231.22-electron.0
OS: Windows_NT x64 10.0.19045
```

---

### @aiday-mar (2026-02-12T16:41:43Z)

Hi everyone thank you for commenting on this issue. I am trying to reproduce this issue and have not been able to yet. If you find a consistent way to reproduce this issue, could you paste the steps here?

---

### @yamachu (2026-02-12T18:02:13Z)

Same issue.

While reliable reproduction is difficult, I was able to reproduce it under the following conditions:

- Editing files using the scm diff editor
- Enabling GitHub Copilot to trigger inline suggestions
- Editing TypeScript files

Version: 1.110.0-insider (Universal)
Commit: 5cc2b2a6f7d3861858ccb41e593582124a659d94
Date: 2026-02-12T05:05:38.334Z
Electron: 39.3.0
ElectronBuildId: 13168319
Chromium: 142.0.7444.265
Node.js: 22.21.1
V8: 14.2.231.22-electron.0
OS: Darwin arm64 25.2.0

```
  ERR Cannot read properties of undefined (reading 'getViewLineMinColumn'): TypeError: Cannot read properties of undefined (reading 'getViewLineMinColumn')
    at Fht.getViewLineMinColumn (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:677:54736)
    at Uht.getLineMinColumn (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:677:79344)
    at Uht.getModelVisibleRanges (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:677:67211)
    at Uht._handleVisibleLinesChanged (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:677:67481)
    at Uht.onDidChangeContentOrInjectedText (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:677:71842)
    at Hd._onDidChangeContentOrInjectedText (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:676:3994)
    at Hd.handleBeforeFireDecorationsChangedEvent (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:676:3495)
    at b7t.handleBeforeFire (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:666:35362)
    at b7t.doFire (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:676:23513)
    at b7t.endDeferredEmit (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:676:22393)
    at Hd.deltaDecorations (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:676:5318)
    at wgi.update (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:1753:25906)
    at ZTe._updateDecorations (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:1753:25386)
    at vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:1753:24760
    at Array.forEach (<anonymous>)
    at ZTe._handleMarkerChange (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:1753:24703)
    at B8._deliver (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:405:2892)
    at B8._deliverQueue (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:405:2981)
    at B8.fire (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:405:3316)
    at vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:405:5113
```

---

### @langningchen (2026-02-13T00:08:09Z)

~~That makes sense. I've also been experiencing this specifically while editing TypeScript files.~~ However, it doesn't seem limited to the SCM diff editor. I've encountered it in the standard editor as well.

An update on my testing: I've had Copilot disabled for a day now and haven't seen the issue yet. I will keep it disabled for a while longer to see if it's really gone.

---

### @langningchen (2026-02-18T01:57:51Z)

This issue occurred while GitHub Copilot was enabled during Rust development.

<img width="1213" height="667" alt="Image" src="https://github.com/user-attachments/assets/decfbc4f-0067-4531-bfda-622d9ccdbdb9" />

---

### @alexr00 (2026-02-20T09:04:29Z)

We're still seeing a lot of hit of this error, and I think I just saw it crash the extension host on my machine.

First instance of the error: 

```
ERR Cannot read properties of undefined (reading 'getViewLineMinColumn'): TypeError: Cannot read properties of undefined (reading 'getViewLineMinColumn')
    at Xht.getViewLineMinColumn (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:54736)
    at igt.getLineMinColumn (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:79344)
    at igt.getModelVisibleRanges (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:67211)
    at igt._handleVisibleLinesChanged (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:67481)
    at igt.onDidChangeContentOrInjectedText (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:71842)
    at Ud._onDidChangeContentOrInjectedText (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:676:3994)
    at Ud._emitContentChangedEvent (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:667:1038)
    at Ud._doApplyEdits (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:676:2768)
    at Ud.applyEdits (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:676:1338)
    at a.pushEditOperation (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:646:940)
    at Ud._pushEditOperations (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:676:263)
    at Ud.pushEditOperations (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:674:544)
    at w6._innerExecuteCommands (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:5875)
    at w6.executeCommands (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:5295)
    at RSe._executeEditOperation (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:676:45718)
    at vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:3597
    at RSe._executeEdit (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:1056)
    at RSe.executeCommands (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:677:3574)
    at vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:3581
    at igt._emitViewEvent (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:4648)
    at vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:4550
    at Object.batchChanges (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:680:19618)
    at igt._withViewEventsCollector (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:4528)
    at igt._executeCursorEdit (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:2873)
    at igt.executeCommands (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:3546)
    at Ur.executeCommands (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:680:11636)
    at a.runCoreEditingCommand (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:446:41246)
    at a.runEditorCommand (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:446:39283)
    at vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:414:10162
    at vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:414:10073
    at a.invokeFunction (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1834:943)
    at Ur.invokeWithinContext (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:678:17672)
    at a.runEditorCommand (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:414:9999)
    at a.runCommand (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:414:10109)
    at handler (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:414:8474)
    at a.invokeFunction (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1834:943)
    at N6e._tryExecuteCommand (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1731:4959)
    at N6e.executeCommand (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1731:4373)
    at l5._doDispatch (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1709:16702)
    at l5._dispatch (vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1709:13601)
    at vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code%20Insiders/243a432d16/resources/app/out/vs/workbench/workbench.desktop.main.js:1710:3124
```

---

### @alexr00 (2026-02-20T09:05:19Z)

Adding @alexdima  for `onDidChangeContentOrInjectedText`. 

---

### @alexdima (2026-02-21T22:16:44Z)

Notes from the debug session. We didn't find clear repro steps, but the problem was that there was a view model which had all lines invisible (i.e. like folded away). I believe it was one of the NES view models (the side-by-side one or the jump one) where hidden areas are used to mask the majority of the file. This is a long-standing problem, but together with https://github.com/microsoft/vscode/pull/292846 , where a broken view model can cause other view models to not see change events, this became a critical problem.

---
