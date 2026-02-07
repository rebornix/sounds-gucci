# Issue #290346: Unread state seems flaky and random

**Repository:** microsoft/vscode
**Author:** @jrieken
**Created:** 2026-01-26T09:35:37Z
**Labels:** bug, verified, insiders-released, chat-agents-view

## Description

Restarted insiders to this unread state. I am very certain I had all sessions read/worked on, esp local unread sessions are very confusing

<img width="406" height="516" alt="Image" src="https://github.com/user-attachments/assets/4cc6ef11-75d4-41b5-9f8f-fb0d98aa1c04" />

## Comments


### @bpasero (2026-01-26T11:02:21Z)

@jrieken if you set the instance to trace logging there is a "Agent Sessions" log with more details. It will be a snapshot in time, so we cannot really figure out what happened, but we can use it as a baseline if this happens again.

**Some questions:**
* did this happen in the same workspace (state is tracked per workspace currently)
* could it be that you had many unread sessions before but simply did not see it because they were not visually expanded in the chat view?

---

### @jschmdt (2026-01-27T21:27:59Z)

@bpasero Same for me. I made sure to go through all my sessions manually, open them one by one to mark them as "read" (the blue dot disappeared). But as soon as I open a new Vscode window all of my sessions inside the "Chat overview" are again "unread" (blue dots reappeared for each session).

Version: 1.109.0-insider
Commit: e7a06c8eabf2915e2c383b1ce6d2b993d90e2e92
Date: 2026-01-27T07:16:53.085Z (14 hrs ago)

---

### @bpasero (2026-01-28T06:36:06Z)

@jschmdt that can be explained by https://github.com/microsoft/vscode/issues/286494

---

### @bpasero (2026-01-28T09:31:44Z)

I will push a state to reset the unread state so we have a fresh start. We know the old tracking was buggy and has since improved.

---
