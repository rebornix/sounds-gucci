# Issue #290873: In stacked view filtering resets the more expansion making filtering hard to see

**Repository:** microsoft/vscode
**Author:** @lramos15
**Created:** 2026-01-27T15:47:11Z
**Labels:** bug, verification-found, chat-agents-view

## Description

Testing #290650

1. Show sessions stacked
2. Click the unread filter
3. Nothing appears to change
4. Click more to see the rest of the unread sessions
5. Unclick the filter and see more collapses


When you have just unreads for example nothing really changes besides the number more shows making it a little challenging to see things are being filtered as I cannot expand and see the list filter down

## Comments


### @joshspicer (2026-01-27T21:38:11Z)

@bpasero One way I can think of making this more useful is that, when you're filtering for 'unread' the 'More' section automatically expands.  

That way whenever you make an explicit filter change (either from the agent status, or from your funnel button), the user sees 'everything'

What do you think?

---

### @bpasero (2026-01-28T11:39:32Z)

Will push a fix to auto-expand for this specific filter because it is so prominently exposed from the title control now.

---

### @lramos15 (2026-01-29T16:48:45Z)

https://github.com/user-attachments/assets/8df060da-ec41-46b2-bd98-018b4c230360

Something weird is still happening here around the 7 second mark I click more, then the filter, and the filter is then turned off. I don't click a secon time to turn it off it's just automatically turned off

---
