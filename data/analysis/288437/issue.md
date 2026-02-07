# Issue #288398: Leak

**Repository:** microsoft/vscode
**Author:** @bpasero
**Created:** 2026-01-16T16:11:29Z
**Labels:** insiders-released

## Description

```
Extension host with pid 21742 exited with code: 0, signal: unknown.
[21707:0116/171056.910791:INFO:CONSOLE:24] "[LEAKED DISPOSABLE] Error: CREATED via:
    at GCBasedDisposableTracker.trackDisposable (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js:28:23)
    at trackDisposable (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js:204:24)
    at new Disposable (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js:416:9)
    at new Action (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/actions.js:16:9)
    at new ShowLanguageExtensionsAction (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/workbench/browser/parts/editor/editorStatus.js:924:9)
    at InstantiationService._createInstance (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/platform/instantiation/common/instantiationService.js:130:24)
    at InstantiationService.createInstance (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/platform/instantiation/common/instantiationService.js:101:27)
    at ChangeLanguageAction.run (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/workbench/browser/parts/editor/editorStatus.js:1015:50)
    at handler (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/platform/actions/common/actions.js:460:48)
    at idOrCommand.handler (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/platform/commands/common/commands.js:37:24)", source: vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js (24)
[21707:0116/171056.910895:INFO:CONSOLE:24] "[LEAKED DISPOSABLE] Error: CREATED via:
    at GCBasedDisposableTracker.trackDisposable (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js:28:23)
    at trackDisposable (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js:204:24)
    at new Disposable (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/lifecycle.js:416:9)
    at new Action (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/base/common/actions.js:16:9)
    at new ShowLanguageExtensionsAction (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/workbench/browser/parts/editor/editorStatus.js:924:9)
    at InstantiationService._createInstance (vscode-file://vscode-app/Users/bpasero/Development/Microsoft/vscode/out/vs/platform/instantiation/common/instantiationService.js:130:24)
```

## Comments

