# Issue #302690: ExtensionEditor can not show dependencies

**Repository:** microsoft/vscode
**Author:** @SvenZhang1
**Created:** 2026-03-18T07:16:11Z
**Labels:** bug, verified, extensions, insiders-released

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
- VS Code Version:  1.111.0
- OS Version: 

Steps to Reproduce:

1. search extensions on marketplace
2. choose a extension that has dependencies and open ExtensionEditor and click dependencies navigation bar
3. dependencies cannot be shown unless you move the scroll bar

## Comments


### @SvenZhang1 (2026-03-18T07:19:13Z)

<img width="2037" height="617" alt="Image" src="https://github.com/user-attachments/assets/23ab45ef-4d0c-49cd-81aa-e2742a50ee1c" />

<img width="2074" height="447" alt="Image" src="https://github.com/user-attachments/assets/7b2d18b0-d139-4fbe-8a57-b7dbb6a9b717" />

---

### @SvenZhang1 (2026-03-18T07:21:26Z)

First picture is the first glance when I click dependencies navigation bar, However, nothing shows there.
I can only see dependencies after I move the side scroll bar. However, side bar height has some problems since I can move side bar to hide view of dependencies, this should not happen.

---
