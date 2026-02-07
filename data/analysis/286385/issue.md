# Issue #286336: Memory leak related to diff editor

**Repository:** microsoft/vscode
**Author:** @SimonSiefke
**Created:** 2026-01-07T10:55:26Z
**Labels:** bug, verified, freeze-slow-crash-leak, diff-editor, confirmed, insiders-released

## Description

<!-- ⚠️⚠️ Do Not Delete This! bug_report_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- 🕮 Read our guide about submitting issues: https://github.com/microsoft/vscode/wiki/Submitting-Bugs-and-Suggestions -->
<!-- 🔎 Search existing issues to avoid creating duplicates. -->
<!-- 🧪 Test using the latest Insiders build to see if your issue has already been fixed: https://code.visualstudio.com/insiders/ -->
<!-- 💡 Instead of creating your report here, use 'Report Issue' from the 'Help' menu in VS Code to pre-fill useful information. -->
<!-- 🔧 Launch with `code --disable-extensions` to check. -->
Does this issue occur when all extensions are disabled?: Yes

<!-- 🪓 If you answered No above, use 'Help: Start Extension Bisect' from Command Palette to try to identify the cause. -->
<!-- 📣 Issues caused by an extension need to be reported directly to the extension publisher. The 'Help > Report Issue' dialog can assist with this. -->
- VS Code Version: 1.108.0
- OS Version: Ubuntu 25.04


When opening two diff editors, then closing all editors, the number of various functions seems to grow each time.



This is the full test result data of the diff-editor-open-side-by-side test, showing which functions grow between the start and end of the test:
![diff-editor-side-by-side](https://github.com/user-attachments/assets/c9e5ce92-63c8-4a9b-80a7-eb899cdc70c8)


The full test result data as json:
[folder.zip](https://github.com/user-attachments/files/24467871/folder.zip)



And the video of the test case:

[video.webm](https://github.com/user-attachments/assets/03ada0a4-f5b1-4588-b13c-d2f5aea2f2c9)

And the script to run it (ensure using node 24 or newer)

Measuring named function count:

```sh
git clone git@github.com:SimonSiefke/vscode-memory-leak-finder.git &&
cd vscode-memory-leak-finder &&
npm ci &&
node packages/cli/bin/test.js  --run-skipped-tests-anyway --check-leaks --measure named-function-count3 --measure-after --runs 37   --only diff-editor-side-by-side 
```


Measuring promises with stacktrace

```sh
node packages/cli/bin/test.js  --run-skipped-tests-anyway --check-leaks --measure promises-with-stack-trace --measure-after --runs 37   --only diff-editor-side-by-side 
```

## Comments


### @vs-code-engineering (2026-01-07T10:56:49Z)

Thanks for creating this issue! It looks like you may be using an old version of VS Code; the latest stable release is 1.107.1. Please try upgrading to the latest version and checking whether this issue remains.

Happy Coding!

---

### @bpasero (2026-01-07T14:29:14Z)

Here is the sequence of steps that reproduces this running out of sources and doing this manually:
* run with `scripts/code-cli.sh --transient` for a clean slate
* open folder with 4 files, `a.txt`, `b.txt`, `c.txt`, `d.txt`
* each file has their name as content
* close all editors
* right click into explorer `a.txt`: Select for compare
* right click into explorer `b.txt`: Compare with
* a diff editor opens in the primary group
* split the diff editor using the split icon top right
* "Close All Editors" from command palette
* take heap snapshot 1 from devtools
* repeat all the steps (except for the heap snapshot) N times
* take heap snapshot 2 from dev tools
* compare the 2 heapsnapshots by picking the option to show allocations between snapshots 1 and 2
* search for classes like `DiffEditorWidget` and notice they exist N times

**Note:** even when all editors are closed, it is expected that at least 1 instance is still around. We always maintain 1 editor group with cached editor instances for speedy opening, but there should never be more than 1 instance when there is just 1 editor group.

<img width="1255" height="336" alt="Image" src="https://github.com/user-attachments/assets/ce9ff52e-a6f0-4cba-ab4f-a3d87e839175" />

<img width="730" height="317" alt="Image" src="https://github.com/user-attachments/assets/6fa8c0ad-e387-40c6-a7a3-50741d406b85" />

I am seeing `gutterFeature` appearing as retainer for many of the objects:

<img width="1716" height="169" alt="Image" src="https://github.com/user-attachments/assets/e5d482fa-91e3-4b5e-93ef-d6c69e6512ca" />

---

### @bpasero (2026-01-07T14:32:29Z)

Opening this up for help wanted, in the team as well as externally. Happy to hear from someone how they worked on finding the actual location where the leak occurs.

---

### @bpasero (2026-01-07T16:17:19Z)

@hediet an actual leak of editor gutter: https://github.com/microsoft/vscode/pull/286385

Thanks @jrieken for helping me understand the heap snapshot 🤝 

---

### @SimonSiefke (2026-01-08T10:32:15Z)

I'm curious how you found the exact location in the end? Was it inspecting the heapsnapshot retainers and they pointed to `gutterFeature` and then to the `Map` in `EditorGutter`? 

Thanks again for the great work! :)

---

### @bpasero (2026-01-08T11:43:42Z)

@SimonSiefke yeah pretty much! in the comparison, `gutterFeature` was appearing at the very top and we found it to hold onto the diff editor widget through a map of views that were never disposed.

---

### @hediet (2026-01-09T10:29:07Z)

Thanks for finding and fixing this! ❤️ 

---
