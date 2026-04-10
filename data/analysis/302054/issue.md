# Issue #302054: "Check for updates" when no updates are available gets stuck

**Repository:** microsoft/vscode
**Author:** @joaomoreno
**Created:** 2026-03-16T11:20:38Z
**Labels:** bug, verified, install-update, insiders-released

## Description

Ensure you're in the latest version. Then:

1. `Check for Updates`. Notice the following popup:

<img width="452" height="288" alt="Image" src="https://github.com/user-attachments/assets/4187e363-4197-4510-b52a-1b80c5f9783a" />

2. `Check for Updates` again.

🐛 Popup goes again. From now on, running `Check for Updates` will no longer show the popup.

## Comments


### @dmitrivMS (2026-03-16T20:20:27Z)

@joaomoreno I am unable to repro... I see pop up every time.
What do you have for `update.titleBar` setting?

---

### @dmitrivMS (2026-03-16T21:02:52Z)

Either way, I have a PR that should help.

---

### @joaomoreno (2026-03-23T11:34:04Z)

Still the same:

https://github.com/user-attachments/assets/6c286f07-738f-45e9-a93f-a79fbaff3653

- I think even the first attempt to check for updates is a bad UX at telling me there are no updates. The widget shows up, flickers a bit and looks like there's something for me there. I have to squint and read the message at the bottom of the popup to know there are no updates available.
- Subsequent requests to check for updates have no feedback whatsoever.

---

### @dmitrivMS (2026-03-30T04:42:22Z)

Will show a modal dialog as before instead of the tooltip.

---
