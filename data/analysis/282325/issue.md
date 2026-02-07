# Issue #281630: Duplicated file changes part for background session when `chat.checkpoints.showFileChanges` is turned on

**Repository:** microsoft/vscode
**Author:** @rebornix
**Created:** 2025-12-05T22:48:11Z
**Labels:** bug, verified, candidate, insiders-released

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

When we turn on `chat.checkpoints.showFileChanges`, it shows up in background session as well. However background session already registers its own file changes part

<img width="1786" height="903" alt="Image" src="https://github.com/user-attachments/assets/ab369a97-972b-418b-9a8c-13f0da2450a4" />

@osortega I think we should hide this for non-local sessions even if it's turned on. From what I see, `chat.checkpoints.showFileChanges` part is not working properly for background session.

## Comments

