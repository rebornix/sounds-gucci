# Issue #212713: Model is disposed!

**Repository:** microsoft/vscode
**Author:** @vscodenpa
**Created:** 2024-05-14T16:33:09Z
**Labels:** error-telemetry, insiders-released

## Description

```javascript
Error: Model is disposed!
at V.ib in src/vs/editor/common/model/textModel.ts:416:10
at V.validateRange in src/vs/editor/common/model/textModel.ts:1062:8
at V.tb in src/vs/editor/common/model/textModel.ts:1251:9
at V.ub in src/vs/editor/common/model/textModel.ts:1262:21
at V.applyEdits in src/vs/editor/common/model/textModel.ts:1416:28
at i.$onVirtualDocumentChange in src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts:88:11
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=dc96b837cf6bb4af9cd736aa3af08cf8279f7685&bH=4eff9e3b-4271-0907-32e2-4afa346d5cef)

## Comments

