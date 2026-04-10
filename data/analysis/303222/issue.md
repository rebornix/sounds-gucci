# Issue #303222: Update widget doesn't behave nicely as the window gets horizontally collapsed

**Repository:** microsoft/vscode
**Author:** @dmitrivMS
**Created:** 2026-03-19T15:20:15Z
**Labels:** bug, install-update, verification-found

## Description

## Bug Description
The update widget in VS Code does not behave as expected when the application window is horizontally collapsed. UI elements get cut off, overlap, or do not gracefully adapt to reduced window width.

## Steps to Reproduce
1. Open VS Code and ensure there is an update widget visible (e.g., an update banner/bar).
2. Gradually collapse (reduce) the horizontal width of the VS Code window.
3. Notice if the update widget fails to adjust layout, gets clipped, or otherwise becomes difficult to interact with.

## Expected Behavior
The update widget should responsively and gracefully handle reduced window widths, reflowing UI or providing overflow indicators as needed, to maintain a usable experience.

## Actual Behavior
The widget UI becomes problematic or misaligned as window width decreases.

---

*Conversation context: Reported via Slack thread: "Update widget doesn't behave nicely as the window gets horizontally collapsed"*

---
**Does this issue occur when all extensions are disabled?**: [Please answer]

**VS Code Version**: [Please specify]
**OS Version**: [Please specify]

[View original Slack conversation](https://vscodeteam.slack.com/archives/C0AK0HFR45C/p1773931588166369?thread_ts=1773931588.166369&cid=C0AK0HFR45C)

## Comments


### @KevinSailema (2026-03-20T07:39:28Z)

Hi! I was able to reproduce this locally. The UI elements in the update **widget overlap** and get cut off when the window is narrowed. I am currently working on a fix for the layout/CSS and will open a PR shortl

---

### @lramos15 (2026-04-06T12:35:37Z)

The window controls can still overlap with the button 

<img src="https://github.com/user-attachments/assets/adad6524-5324-424c-b9aa-7bb8bb07f8d7" alt="Image" width="269" height="37">

---

### @KevinSailema (2026-04-06T15:47:23Z)

Hello @lramos15, I found a potential tweak that seems to fix the overlap, even when the window is fully collapsed horizontally (as shown in the attached screenshot). I just wanted to share this approach to see if it would be considered a valid route.

<img width="512" height="815" alt="Image" src="https://github.com/user-attachments/assets/1fbb3c43-f5b2-4f0e-94f3-e9615d4942f7" />

---
