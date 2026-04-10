# Issue #303906: Enter key broken in some integrated browser scenarios

**Repository:** microsoft/vscode
**Author:** @kycutler
**Created:** 2026-03-22T19:39:26Z
**Labels:** bug, verified, insiders-released, browser-integration

## Description

1. Open [Monaco Editor Playground](https://microsoft.github.io/monaco-editor/playground.html) in the integrated browser
2. Press Enter to insert a newline
3. 🐛 no newline is inserted

Related: https://github.com/microsoft/vscode/issues/303908

## Comments


### @kycutler (2026-03-22T19:45:23Z)

This is due to the kb-accessible add element to chat support. FYI @meganrogge

---
