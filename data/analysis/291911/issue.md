# Issue #290863: Clicking from unread to in progress toggles all filters off

**Repository:** microsoft/vscode
**Author:** @lramos15
**Created:** 2026-01-27T15:35:00Z
**Labels:** bug, verified, candidate

## Description

Testing #290650

1. Have unread and in progress sessions
2. Click the unread session indicator in the title
3. Click the in progress indicator in the title
4. 🐛 No filters are applied

## Comments


### @joshspicer (2026-01-27T21:13:48Z)

Not immediately reproing - will continue testing

https://github.com/user-attachments/assets/a925026d-af74-44f0-8817-2a058147d5ca

---

### @lramos15 (2026-01-27T21:22:35Z)

https://github.com/user-attachments/assets/f52514c9-e87b-415a-b9f0-45e5be661982

---

### @joshspicer (2026-01-27T22:56:28Z)

@lramos15 you mentioned to me that in progress session was 'in a weird state'. What is up with it?  What happens if you use the filter button and filter for 'in progress'

---

### @joshspicer (2026-01-27T23:28:41Z)

nevermind, I think i've pinned it down 

---

### @joshspicer (2026-01-29T11:59:22Z)

I believe this is resolved now that the counts from the model match the indicators we display (brief period of time that they didn't)

---

### @lramos15 (2026-01-29T16:53:36Z)

Still seeing this. You can even see that read actually toggled off when I clicked it and I had to toggle it again

https://github.com/user-attachments/assets/90912719-f5e4-462e-8f3f-78052881b3c0

---

### @benibenj (2026-01-30T14:52:45Z)

Also seeing it. It flickers every second time I enable the filter

https://github.com/user-attachments/assets/70316e0f-5725-4fe8-ba1a-b137c80a8423

---

### @joshspicer (2026-01-30T15:27:34Z)

Confirmed with @benibenj that he has two VS Code window open, which I believe is the cause of the bug.

Currently filters are stored per profile, which is causing this unexpected behavior. The window without any pending notifications sees that and triggers exiting the filter.

We should think about changing the [scope of filtering from PROFILE](https://github.com/microsoft/vscode/blob/f8e5529db51a528be9d3b2e0c600f269b309d8dc/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsFilter.ts#L107-L108) to perhaps the window?

I will make a targetted fix for this iteration to solve the problem

---
