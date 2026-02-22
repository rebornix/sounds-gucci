# Issue #251601: ListError [NotebookCellList] Invalid index 50

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-06-16T13:32:25Z
**Labels:** error-telemetry

## Description

```javascript
Error: ListError [NotebookCellList] Invalid index 50
at E_e.getCellViewScrollTop in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/workbench/contrib/notebook/browser/view/notebookCellList.ts:754:10
at AQ.createMarkupPreview in vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts:2874:30
at s in vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts:1248:10
at execute in vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts:1260:3
at <anonymous> in vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts:1225:9
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=dfaf44141ea9deb3b4096f7cd6d24e00c147a4b1&bH=809a7739-c0db-98c8-595c-8ec19e4ca0bb)

## Comments


### @Tyriar (2025-06-16T13:33:04Z)

Similar:

```javascript
Error: ListError [NotebookCellList] Invalid index 50
at E_e.getCellViewScrollTop in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/workbench/contrib/notebook/browser/view/notebookCellList.ts:754:10
at AQ.createMarkupPreview in vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts:2874:30
at Object.s [as callback] in vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts:1248:10
at <anonymous> in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/platform.ts:232:17
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=dfaf44141ea9deb3b4096f7cd6d24e00c147a4b1&bH=8f8f7eb4-fff0-8331-d5bd-5203283ba270)

---
