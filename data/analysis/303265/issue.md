# Issue #303265: terminal output is missing when using Copilot CLI

**Repository:** microsoft/vscode
**Author:** @meganrogge
**Created:** 2026-03-19T17:12:15Z
**Labels:** bug, verified, copilot-cli-agent

## Description

It's trunchated

<img width="472" height="230" alt="Image" src="https://github.com/user-attachments/assets/c667b45c-a3c2-47b8-94ea-9d1332df80dd" />

<img width="1302" height="837" alt="Image" src="https://github.com/user-attachments/assets/3668a9d5-5b5e-4516-8307-20f17318b95c" />

## Comments


### @DonJayamanne (2026-03-19T18:17:25Z)

@meganrogge Looks like an issue in terminal rendering,
If you use your mouse wheel I think you'll see that it scrolls and displays the rest of the listings.
The output is not missing, but terminal output rendering is not right

---

### @copilot-swe-agent (2026-03-19T18:35:31Z)

The agent encountered an error and was unable to start working on this issue: This may be caused by a repository ruleset violation. See [granting bypass permissions for the agent](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-branch-or-tag-ruleset), or please contact support if the issue persists.

---

### @jruales (2026-03-30T17:00:42Z)

@DonJayamanne  I've validated that the terminal shows the full output and is scrollable.
However, despite being vertically scrollable, the vertical scrollbar doesn't show up. I'm on Windows.

![Image](https://github.com/user-attachments/assets/018bf543-6d0a-4326-82f2-e7bcef56caf7)

---

### @DonJayamanne (2026-03-30T17:54:17Z)

Marking this as verified as the lack of scroll bar is a separate (existing = exists in local as well) issue https://github.com/microsoft/vscode/issues/306410

---
