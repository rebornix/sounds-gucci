# Issue #291099: Agent session mode breaks the tri-state toggle of the chat icon in the title bar

**Repository:** microsoft/vscode
**Author:** @sbatten
**Created:** 2026-01-27T23:31:52Z
**Labels:** bug, verified, insiders-released, chat-agents-view

## Description

Testing #290241

1. Enable Agent Session Mode
2. Click the sparkle chat icon
🐛 => nothing happens, even if the chat view is not maximized

## Comments


### @bpasero (2026-01-28T10:21:21Z)

Pushing a fix to ensure clicking chat title always maximises the 2nd sidebar and focuses the input. That was the intent in agent sessions window at least.

---

### @sbatten (2026-01-29T04:04:03Z)

I verified it does what you say. I do find it strange that the mode does something different but I also understand the new mode is a new way and if I can live only there, great :)

---
