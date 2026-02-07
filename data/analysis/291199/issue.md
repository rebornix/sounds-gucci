# Issue #290642: Running chat not marked as 'in-progress' if currently viewed

**Repository:** microsoft/vscode
**Author:** @joshspicer
**Created:** 2026-01-27T00:38:09Z
**Labels:** bug, verification-steps-needed, insiders-released, chat-agents-view

## Description

<!-- ⚠️⚠️ Do Not Delete This! bug_report_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- 🕮 Read our guide about submitting issues: https://github.com/microsoft/vscode/wiki/Submitting-Bugs-and-Suggestions -->
<!-- 🔎 Search existing issues to avoid creating duplicates. -->
<!-- 🧪 Test using the latest Insiders build to see if your issue has already been fixed: https://code.visualstudio.com/insiders/ -->
<!-- 💡 Instead of creating your report here, use 'Report Issue' from the 'Help' menu in VS Code to pre-fill useful information. -->
<!-- 🔧 Launch with `code --disable-extensions` to check. -->
Does this issue occur when all extensions are disabled?: Yes/No

<!-- 🪓 If you answered No above, use 'Help: Start Extension Bisect' from Command Palette to try to identify the cause. -->
<!-- 📣 Issues caused by an extension need to be reported directly to the extension publisher. The 'Help > Report Issue' dialog can assist with this. -->
- VS Code Version: 
- OS Version: 

1. Start a chat
2. 🐛  Note that you need to move focus to another chat for the 'Agent Status' indicator to show +1

https://github.com/user-attachments/assets/49687bd8-fd6d-4087-9334-537b64fa9d8e

## Comments


### @bpasero (2026-01-27T05:56:38Z)

@joshspicer this was intentional to fix https://github.com/microsoft/vscode/issues/289831, otherwise you get the title control increase in size and shrink again on each chat interaction. We can change it back but isn't it more interesting to see sessions that run in the background?

Commit: https://github.com/microsoft/vscode/commit/87e6108688849dc201fcd2b50e4e36cd62a6a53e

cc @eli-w-king @jo-oikawa for input

---

### @joshspicer (2026-01-27T16:12:08Z)

I see, the visual distraction makes sense. Though, I think it feel more strange that a running session (in front of your eyes) doesn't 'count' as in-progress

---

### @joshspicer (2026-01-27T18:08:32Z)

Some TPI testing that felt the feature broken due to this behavior https://github.com/microsoft/vscode/issues/290908

---

### @joshspicer (2026-01-27T23:14:11Z)

I _think_ this is the root cause for https://github.com/microsoft/vscode/issues/290863

`_clearFilterIfCategoryEmpty` needs to check for session existence INCLUDING the sessions ignored due to them being open

---

### @eleanorjboyd (2026-01-29T22:04:05Z)

did we change this UI- not seeing it anymore

---
