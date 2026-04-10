# Issue #303769: Sandboxed terminal commands end up in my shell history

**Repository:** microsoft/vscode
**Author:** @roblourens
**Created:** 2026-03-21T19:15:13Z
**Labels:** bug, verified, insiders-released, agent-sandbox

## Description

Normally, we prepend a space to terminal commands, which prevents them from being added to history. It looks like sandboxed commands don't get that, so my shell history is polluted with agent commands. 

<img width="1057" height="150" alt="Image" src="https://github.com/user-attachments/assets/cdd304fa-abcd-4568-a951-2d069a38cbc0" />

## Comments

