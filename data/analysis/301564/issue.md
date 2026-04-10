# Issue #301564: Accessible View should include file paths when presenting file references

**Repository:** microsoft/vscode
**Author:** @meganrogge
**Created:** 2026-03-13T18:41:33Z
**Labels:** bug, accessibility, insiders-released, chat

## Description

### Problem
In Accessible View, file references are shown without their corresponding file paths in scenarios where the visual UI includes enough context to identify the file/location only when hyperlinked/clickable.

For screen reader users, this removes critical context and makes it difficult to understand or navigate the referenced location.

### Steps to Reproduce
1. Open a workflow that surfaces file/location references in the UI (for example, references/links that visually imply a file target).
2. Open Accessible View for that content.
3. Compare the visual content vs Accessible View text output.

### Actual Behavior
Accessible View text omits file paths for references that should carry path context.

### Expected Behavior
Accessible View should include file path context (and, where available, line/column) for file references so the text representation is semantically equivalent to the visual content.

### Why this matters
Accessible View is intended to provide a complete textual representation of rich/visual content. Missing file paths creates an accessibility regression because important navigation context is lost.

### Suggested direction
- Ensure accessible-view content providers include path metadata when generating text for file references.
- Preserve parity between visual link context and accessible text output.

## Comments


### @vs-code-engineering (2026-03-13T18:42:22Z)

Hi @meganrogge. As a member of the team, you can help us triage this issue by referring to https://github.com/microsoft/vscode-copilot/wiki/Copilot-Inbox-Tracker and assigning an owner directly.

---

### @meganrogge (2026-03-13T18:44:08Z)

@jooyoungseo

---

### @meganrogge (2026-03-13T18:49:57Z)

@accesswatch 

---

### @vs-code-engineering (2026-03-23T22:19:13Z)

Sharing media from merged PR #301565 for verification:

<img width="947" height="461" alt="Screenshot 2026-03-17 at 12 38 38 PM" src="https://github.com/user-attachments/assets/9fb53bb1-e9bf-49b0-a0fc-85e6a95c010e" />

Source PR: https://github.com/microsoft/vscode/pull/301565

---

### @alexdima (2026-03-24T01:40:53Z)

@meganrogge Had to revert the fix due to unit test failures on Windows. Also note that the milestone is wrong, this only got merged to `main` after the `release/1.113` was forked off, so it was never on `1.113`

---
