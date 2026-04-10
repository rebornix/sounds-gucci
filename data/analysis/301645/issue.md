# Issue #301645: Built-in Profile template "Python" fails to create — Create button disabled

**Repository:** microsoft/vscode
**Author:** @LiaoGuoYin
**Created:** 2026-03-14T02:17:42Z
**Labels:** bug, insiders-released

## Description

<!-- ⚠️⚠️ Do Not Delete This! bug_report_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- 🕮 Read our guide about submitting issues: https://github.com/microsoft/vscode/wiki/Submitting-Bugs-and-Suggestions -->
<!-- 🔎 Search existing issues to avoid creating duplicates. -->
<!-- 🧪 Test using the latest Insiders build to see if your issue has already been fixed: https://code.visualstudio.com/insiders/ -->
<!-- 💡 Instead of creating your report here, use 'Report Issue' from the 'Help' menu in VS Code to pre-fill useful information. -->
<!-- 🔧 Launch with `code --disable-extensions` to check. -->

<!-- 🪓 If you answered No above, use 'Help: Start Extension Bisect' from Command Palette to try to identify the cause. -->
<!-- 📣 Issues caused by an extension need to be reported directly to the extension publisher. The 'Help > Report Issue' dialog can assist with this. -->

## Built-in Profile template "Python" fails to create — Create button disabled

**VS Code Version:** 1.111.0 (ce099c1, arm64)
**OS:** macOS 15 (Darwin 25.2.0, Apple Silicon)

### Problem

Selecting the built-in "Python" template via `Profiles: Create Profile` fails silently — the **Create button stays disabled** and the profile is never registered.

### Root Cause

The CDN-hosted template at `https://main.vscode-cdn.net/core/python.code-profile` includes two Copilot extensions:

```
github.copilot        (GitHub Copilot)
github.copilot-chat   (GitHub Copilot Chat)
```

When VS Code attempts to install these extensions during profile creation, it gets stuck at "Started installing extensions" and **never reaches "Finished"**. Meanwhile, the "Doc Writer" template (which does not include these extensions) completes successfully.

### Evidence from renderer.log

```
09:25:26 Importing Profile (Python): Started installing extensions.   ← never finishes
09:26:02 Importing Profile (Python): Started installing extensions.   ← retry, still stuck
09:28:00 Importing Profile (Python): Started installing extensions.   ← stuck again

09:29:00 Importing Profile (Doc Writer): Started installing extensions.
09:29:17 Importing Profile (Doc Writer): Finished installing extensions. ← completes fine
```

Additionally, there are repeated JSON parse errors from `getChildrenFromProfileTemplate`:

```
Expected property name or '}' in JSON at position 3 (line 2 column 2)
    at JSON.parse (<anonymous>)
    at KF.apply (workbench.desktop.main.js:1798:29635)
    at Iy.getChildrenFromProfileTemplate (workbench.desktop.main.js:4912:60906)
```

And 404 errors from Extension Host when resolving the template:

```
[Extension Host] GET /gists/python.code-profile - 404
```

### Side Effect

Each failed attempt creates an orphan profile directory under `~/Library/Application Support/Code/User/profiles/` that is never registered in `storage.json`. After multiple attempts, I had **29 orphan directories** with only 1 registered profile.

### Workaround

Download the template file from `https://main.vscode-cdn.net/core/python.code-profile`, remove the `github.copilot` and `github.copilot-chat` entries from the `extensions` field (and related references in `globalState`), then import via **Profiles: Import Profile** from file.

### Suggested Fix

1. Update the CDN template to remove or replace the deprecated `github.copilot` extension entry
2. Handle extension installation failures gracefully — a single extension failure should not block the entire profile creation

Does this issue occur when all extensions are disabled?: Yes

## Comments


### @brunojustino (2026-03-14T15:27:33Z)

I had this same problem and the op solution(removing copilot from the profile file) worked for me.

---
