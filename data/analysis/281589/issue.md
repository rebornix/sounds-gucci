# Issue #275332: Agent sessions single view: standardize the session item entries

**Repository:** microsoft/vscode
**Author:** @osortega
**Created:** 2025-11-04T21:23:42Z
**Labels:** bug, verified, candidate, chat-agents-view

## Description

Testing #274477

It looks strange to me how each session looks very different from each other depending on the provider, specially right now Copilot cloud vs anything else.
I like that we are showing the state in the description, should we standardize that and show that for all regardless of the provider? And if we do that, should we just remove the icon on the right?

![Image](https://github.com/user-attachments/assets/0892caff-409f-41d1-a70a-cea2c9771c5f)

## Comments

### @bpasero (2025-11-06T19:55:57Z)

@osortega can you please take this and update what the copilot remote provider returns? I think just the bare PR number is a bit thin, how about `Finished in <PR>`?

---

### @eleanorjboyd (2025-12-03T23:38:00Z)

formatting is more consistent but still seeing background ones including the branch name where the cloud ones include files changed?
![Image](https://github.com/user-attachments/assets/94a7e64c-8332-4fe1-abf5-96ac2c988c00)

---

### @osortega (2025-12-04T15:26:41Z)

For verification steps:
- Finished chats that did edits should show the file stats in the description (+/-)
- Finished chats that did not do edits should show progress or finished

Right now there is a bug which causes background tasks not calculate the file stats correctly

---

### @osortega (2025-12-05T06:39:06Z)

Fixed the bug for file stats so the verification steps above should work now

---

### @eleanorjboyd (2025-12-05T17:46:05Z)

The top item is finished- should it say so explicitly or is this the desired behavior?
![Image](https://github.com/user-attachments/assets/7e66451b-77f3-45f7-adbe-a045df190b1b)

---

### @osortega (2025-12-05T20:08:34Z)

This should fix it https://github.com/microsoft/vscode/pull/281589

---
