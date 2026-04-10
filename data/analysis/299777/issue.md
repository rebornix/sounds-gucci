# Issue #299777: Integrated browser add element to chat does not work in debug mode

**Repository:** microsoft/vscode
**Author:** @lambainsaan
**Created:** 2026-03-06T14:52:13Z
**Labels:** bug, verified, insiders-released, browser-integration

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
Version: 1.111.0-insider (Universal)
Commit: de052c15eaefaceaa5b673081e2834f1cdf193db
Date: 2026-03-05T17:35:21-08:00
Electron: 39.6.0
ElectronBuildId: 13330601
Chromium: 142.0.7444.265
Node.js: 22.22.0
V8: 14.2.231.22-electron.0
OS: Darwin arm64 25.2.0

Steps to Reproduce:

1.  Go to a web page
2. Go to sources tab, click on the pause button (F8)
3. Click on add element to chat button
4. Click on any element in the webpage
5. The element will not be added to the chat

It is useful when you have interactive elements and you want to pause the browser and add some element in that current state to the chat context

## Comments

