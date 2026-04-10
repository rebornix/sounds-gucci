# Issue #267538: Original window title incorrect after moving terminal to new window

**Repository:** microsoft/vscode
**Author:** @studgeek
**Created:** 2025-09-19T21:33:26Z
**Labels:** bug, verified, insiders-released, workbench-auxwindow

## Description

<!-- ⚠️⚠️ Do Not Delete This! bug_report_template ⚠️⚠️ -->

After moving a terminal to a new window, the original window's title is incorrectly changed to match the new terminal window's title.

I suspect root cause is same as issue https://github.com/microsoft/vscode/issues/263308 which started happening in the last few months.

Does this issue occur when all extensions are disabled?: Yes

#### Steps to Reproduce:

1. Install new Insiders build with no extensions.
2. Connect to remote workstation via ssh.
3. Open a project (";pigweed (in xxx)" in example below).
4. Open file in project ("acl_data_channel.cc" in example below).
5. Window title is correctly shown as "acl_data_channel.cc — ;pigweed (in xxx) — Visual Studio Code - Insiders"
6. Open a terminal panel (using "View: Toggle Terminal")
7. Move terminal to a new Window (using "Move Terminal into New Window")

##### Expected:
First window title remains "acl_data_channel.cc — ;pigweed (in xxx) — Visual Studio Code - Insiders"
New terminal window title is "bash — ;pigweed (in xxx) — Visual Studio Code - Insiders"

#####  Actual:
First window title incorrectly changed to "bash — ;pigweed (in xxx) — Visual Studio Code - Insiders"
New terminal window title is correctly "bash — ;pigweed (in xxx) — Visual Studio Code - Insiders"

The attached screenshot was taken after step 7. It shows first window has incorrect title "bash — ;pigweed (in xxx) — Visual Studio Code - Insiders".
<img width="1577" height="592" alt="Image" src="https://github.com/user-attachments/assets/d5e6be26-1777-4421-9bec-754ce645e474" />

I also had a  macOS JXA script running that was dumping the window titles from macOS's perspective. It shows how window title reported to macOS incorrectly changed after step 7. You can see JXA script used at end of this issue.

```
# After step 5
2025-09-19 14:11:16 Code - Insiders: acl_data_channel.cc — ;pigweed (in xxx) — Visual Studio Code - Insiders
...
# After step 7
2025-09-19 14:11:21 Code - Insiders: bash — ;pigweed (in xxx) — Visual Studio Code - Insiders
2025-09-19 14:11:21 Code - Insiders: bash — ;pigweed (in xxx) — Visual Studio Code - Insiders
```


#### Version Info
Version: 1.105.0-insider (Universal)
Commit: 824678f51e533e03ed9edc59e5cf858c47718f42
Date: 2025-09-19T05:02:45.062Z
Electron: 37.3.1
ElectronBuildId: 12404162
Chromium: 138.0.7204.235
Node.js: 22.18.0
V8: 13.8.258.31-electron.0
OS: Darwin arm64 24.6.0

#### JXA Script

```
const app = Application.currentApplication();
app.includeStandardAdditions = true;

while (true) {
    const timestamp = app.doShellScript("date '+%Y-%m-%d %H:%M:%S'");
    // console.log(`--- ${timestamp} ---`);

    for (const kProcess of ["Code - Insiders"]) {
        const prefix = timestamp + " " + kProcess + ": "
        try {
            const windows = Application("System Events").processes[kProcess].windows();
            for (const window of windows) {
                console.log(prefix + window.name());
            }
        } catch (e) {
            console.log(prefix + "Process not found.");
        }

    }
    
    delay(1);
}
```

## Comments


### @studgeek (2025-09-19T21:38:50Z)

I was able to replicate issue in a local (non Remote SSH) session. Repro steps are basically the same:


1. Install new Insiders build with no extensions.
3. Open a project
4. Open file in project
5. Window title is correctly shown as "<filename> — <folder> — Visual Studio Code - Insiders"
6. Open a terminal panel (using "View: Toggle Terminal")
7. Move terminal to a new Window (using "Move Terminal into New Window")

##### Expected:
First window title remains "<filename> — <folder> — Visual Studio Code - Insiders"
New terminal window title is "bash — <folder> — Visual Studio Code - Insiders"

#####  Actual:
First window title incorrectly changed to "bash — <folder> — Visual Studio Code - Insiders"
New terminal window title is correctly "bash — <folder> — Visual Studio Code - Insiders"

---

### @egorderg (2026-02-01T10:28:12Z)

This also happens with a search editor or normal files when moved to a new window.

---
