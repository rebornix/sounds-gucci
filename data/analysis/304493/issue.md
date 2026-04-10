# Issue #304493: Browser: Editor ID Mismatch

**Repository:** microsoft/vscode
**Author:** @jruales
**Created:** 2026-03-24T15:47:48Z
**Labels:** bug, verified, insiders-released, browser-integration

## Description

1. Use integrated browser
2. Open output panel and select scope: Window
3. 🐛 In the output panel, you'll see `[warning] [Window] Editor ID Mismatch: workbench.editor.browser !== workbench.editorinputs.browser. This will cause bugs. Please ensure editorInput.editorId matches the registered id`

## Comments

