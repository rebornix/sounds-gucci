# Issue #289688: Claude Agent integration: Archiving a Chat does not prompt me to decide if I want to keep/discard my changes from that chat

**Repository:** microsoft/vscode
**Author:** @TylerLeonhardt
**Created:** 2026-01-22T17:07:14Z
**Labels:** bug, important, verified, regression, insiders-released, chat-agents-view

## Description

workset does show up but it doesn't do what I expect.

Steps:
* Use Claude agent
* get it to make an edit
* New Chat
* Archive that old chat
* :bug: confirmation shows but changes are still there

## Comments


### @connor4312 (2026-01-23T19:45:35Z)

Hm this works for me:

<img width="662" height="214" alt="Image" src="https://github.com/user-attachments/assets/b1d51cee-7424-4f89-81f4-6b7d305820b8" />

- Used claude to edit a readme.md
- New chat
- Went to archive without a keep/undo

Could you grab a recording of what you see so I can try and repro better?

---

### @connor4312 (2026-01-23T19:47:24Z)

Though previously we did ask to keep or undo, I think this is what you mean? Now you can have change still pending which is a bit weird and I think will 'leak' memory because we eagerly restore any sessions that have pending changes on boot. 

@bpasero looks like this was changed in https://github.com/microsoft/vscode/pull/288449, bring back `showClearEditingSessionConfirmation` if you'd like

---

### @TylerLeonhardt (2026-01-23T20:50:39Z)

> Though previously we did ask to keep or undo, I think this is what you mean?

Right. I'm being asked if I want to archive the session, but all the changes from that session are kept around

---

### @bpasero (2026-01-23T21:17:59Z)

What did you do Opus 🤔 

---

### @bryanchen-d (2026-01-29T23:30:32Z)

Verified that changes are not showing up in the workset after confirmation upon achive the session.

---
