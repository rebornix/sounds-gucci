# Issue #289831: Agents control: every chat interaction shows 1 unread

**Repository:** microsoft/vscode
**Author:** @bpasero
**Created:** 2026-01-23T06:52:05Z
**Labels:** bug, verified, ux, under-discussion, insiders-released, chat-agents-view

## Description

https://github.com/user-attachments/assets/9a35bc99-71b7-4a9b-92c1-087f8c0048cf

I think this is not a change for the better: every chat interaction now flashes the title 🤔 . I do not think thats the idea of the title indicator, there probably needs some kind of filter to exclude active sessions from the status?

//cc @jo-oikawa @eli-w-king @lostintangent 

## Comments


### @joshspicer (2026-01-23T18:29:52Z)

@bpasero Since this just listens to the underlying agents model, would it be possible to never set a chat the user has open to 'unread'.  I think that makes more sense anyway, and would solve this. 

If not possible, I can try to special case open chats myself in the widget, but it seems to make sense to address in the model itself? Thoughts?

---
