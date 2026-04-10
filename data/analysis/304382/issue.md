# Issue #304382: Manual check for updates should not shows the title bar UI

**Repository:** microsoft/vscode
**Author:** @jrieken
**Created:** 2026-03-24T07:42:52Z
**Labels:** bug, verified, install-update, insiders-released

## Description

* have no updates
* from the App menu, select Check for Updates
* instead of a modal dialog the title bar affordance shows which is really, really weird

The modal is a response to an explicit user action, the affordance is just there and should info me about this. The mix of today is not great

https://github.com/user-attachments/assets/0569e9e9-3ed5-434c-8128-08373c2adc66

## Comments


### @dmitrivMS (2026-03-24T19:25:38Z)

@jrieken The new affordance replaces many things - the gear badge, the notifications, the status bar and the modal dialog - in this way it's consistent that it is the single update info/action place. What do you like about the modal dialog?

---

### @jrieken (2026-03-25T07:32:21Z)

> in this way it's consistent that it is the single update info/action place. What do you like about the modal dialog?

It less the like for a modal dialog (tho IMO it is the correct thing to do from a menu command) but it is my dislike for showing a hover without user interaction. That's an anti-pattern, hovers should only show when hovering over the respective element

---

### @dmitrivMS (2026-03-30T04:40:12Z)

Will show a modal dialog as before instead of the tooltip.

---
