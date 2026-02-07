# Issue #281149: Local Session shows no empty description/progress when the chat widget is streaming in text

**Repository:** microsoft/vscode
**Author:** @rebornix
**Created:** 2025-12-04T05:20:57Z
**Labels:** bug, verified, chat-agent

## Description

Re https://github.com/microsoft/vscode-internalbacklog/issues/6388

![Image](https://github.com/user-attachments/assets/be351c04-a2da-4e1c-af95-1200032698d1)

Often after a few successful tool calls, the agent starts to stream in text, or just showing "working", the Agent Sessions View shows a blank progress / description for the session.

## Comments

### @rebornix (2025-12-04T05:21:44Z)

After fully finished, it doesn't show "Finished" either 

![Image](https://github.com/user-attachments/assets/dc240379-d07e-4a76-9cc1-36ff6ba16ca0)

---

### @bpasero (2025-12-04T05:56:46Z)

@osortega I leave this to you, thanks.

---

### @osortega (2025-12-05T02:46:40Z)

Fixed in https://github.com/microsoft/vscode/pull/281397

---
