# Issue #291089: In agent session window, layout falls over when opening editors

**Repository:** microsoft/vscode
**Author:** @sbatten
**Created:** 2026-01-27T23:15:17Z
**Labels:** bug, verified, insiders-released, chat-agents-window

## Description

Testing #290241

1. Open agent session window
2. Run "Help: Welcome" command or "Show settings editor"
🐛 => this just pops my terminal (which is aligned to Justify)

## Comments


### @sbatten (2026-01-27T23:16:23Z)

Worse, I cannot close the panel after that either. X does nothing.

---

### @sbatten (2026-01-29T04:05:11Z)

This is not a duplicate as marked. I verified the other and this still repros.

---
