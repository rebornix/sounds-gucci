# Issue #291589: Agent sessions - Session grouping doesn't seem to always account for "yesterday" sessions

**Repository:** microsoft/vscode
**Author:** @lostintangent
**Created:** 2026-01-29T13:37:34Z
**Labels:** bug, insiders-released, chat-agents-view

## Description

I just opened a project and noticed that my sessions from yesterday are showing up in the `Last week` grouping, even though they indicate they were modified `1 day ago`:

<img width="322" height="331" alt="Image" src="https://github.com/user-attachments/assets/c45e809f-2e58-4250-8b71-b837f3d2f9da" />

I wonder if there's a way to ensure that any session that displays `1 day ago` in its list item, would be properly grouped as `Yesterday`? Otherwise, the grouping here felt a bit confusing at first.

## Comments

