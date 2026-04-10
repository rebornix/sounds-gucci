# Issue #296060: Chat input toolbar issues

**Repository:** microsoft/vscode
**Author:** @roblourens
**Created:** 2026-02-18T17:55:19Z
**Labels:** bug, verified, insiders-released, chat-input

## Description

@benibenj are you the one working on this?

I keep seeing this issue where I can't see the model at all, and if I resize the sidebar slightly, then it appears.

https://github.com/user-attachments/assets/e4b4243e-1680-424c-900b-0f9db00c748c

Also- putting the tools button in a ... menu doesn't help anything if there's only one thing in the ... menu. I think we should only use these when there's more than one thing.

## Comments


### @benibenj (2026-02-19T08:50:52Z)

I think it's trying to measure the size of the dom node before it's visible which is causing this to happen. The weird thing is that it only happens when the tool picker is showing next to it, otherwise it never show. The tool picker is a bit wider than the overflow icon which is why it can be in the overflow alone which is not ideal.

I'll have a look

---

### @benibenj (2026-02-26T12:59:21Z)

I might do this as a candidate but haven't been able to fix it yet

---

### @roblourens (2026-02-26T18:15:54Z)

Lmk if you'd like me to take a look, it looks like the kind of dumb browser behavior that will nerd snipe me

---

### @benibenj (2026-02-26T19:49:15Z)

I find this bug really annoying but haven't had a lot of time to look into this and i'm out tomorrow so feel free to have a look :) 

The toolbar supports this responsive layouting, but to be able to do this it measures the dom element. I think it might be measuring when the dom element it is still hidden but not sure. Might also be due to the fact that not all pickers are available on first render.

---

### @roblourens (2026-03-05T19:10:22Z)

https://github.com/user-attachments/assets/8db0976b-de29-4f03-8bb9-513bfab79c66


This has somehow gotten even worse. The overflow truncation is broken too. @justschen are you making changes to this?

---

### @benibenj (2026-03-05T21:07:34Z)

I agree, not sure how the recent changes caused this to become worse. The overflow doesn't even show anymore sometimes. @justschen did you make changes in the toolbar class?

---

### @justschen (2026-03-05T21:14:20Z)

nothing to toolbar specifically - cc @daviddossett maybe?

---

### @daviddossett (2026-03-06T00:48:10Z)

I think https://github.com/microsoft/vscode/pull/299644 should help. I can't repro after these changes

---

### @justschen (2026-03-06T00:56:46Z)

https://github.com/user-attachments/assets/21e80f12-d0d7-4d4e-8a31-a23215014e78

i think it's better yeah

---

### @roblourens (2026-03-21T21:11:41Z)

Here's a PR which _does_ fix the problem https://github.com/microsoft/vscode/pull/303780- however the agent's description of the issue is a bit off. I can't really follow the code and I don't want to debug it manually right now. But leaving it here in case anyone looks at this and finds it helpful. Maybe I'll revisit this because it's a very annoying problem.

---

### @benibenj (2026-03-23T14:12:20Z)

I think I might have a proper fix for this. Will merge today as we already branched off

---

### @benibenj (2026-03-23T15:51:51Z)

Also increased the min width of the pickers which have a chevron and no icon only rendering

---
