# Issue #289062: Chat drag and drop target much smaller since sessions expanded

**Repository:** microsoft/vscode
**Author:** @benibenj
**Created:** 2026-01-20T10:05:36Z
**Labels:** bug, verified, workbench-dnd, insiders-released, chat, chat-agents-view

## Description

![Image](https://github.com/user-attachments/assets/05c3ea1e-0ce9-46eb-a20f-6f9bcb5ec61c)

Chat drag and drop no longer works nicely since the chat sessions expanded to the entire height of the chat view. The target is much smaller than it used to be which breaks muscle memory. It took me a while until I noticed that DnD was still possible but the target was just much smaller.

## Comments


### @bpasero (2026-01-20T13:00:23Z)

Good point, I think we should just allow to drop it anywhere in the view to attach as context.

---
