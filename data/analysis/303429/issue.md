# Issue #303429: Window title variable resolution not working in new command center

**Repository:** microsoft/vscode
**Author:** @benibenj
**Created:** 2026-03-20T09:09:15Z
**Labels:** bug, regression, command-center

## Description

For `window.title` I configured `${rootName} - ${activeRepositoryBranchName}`. This works nicely in VS Code stable currently but in insiders the branch name is not showing anymore:

<img width="2602" height="165" alt="Image" src="https://github.com/user-attachments/assets/24bdf6d0-a1dc-4c4f-85b0-53c38a2dc445" />

## Comments


### @Sayvai (2026-03-23T09:06:07Z)

I have noticed the same regression over the last 2/3 days, whereby it seems like the `activeRepositoryName` (❌) and `separator` (❌) variables are not computed / rendered inside the window title bar, and only `activeFolderMedium` (✅) is computed. 🖼️ See screenshot below:

<img width="1057" height="57" alt="Image" src="https://github.com/user-attachments/assets/b69a9775-c7d4-4d0a-bbbb-c80c23e2ff63" />

My `window.title` user level JSON configuration is as follows:

```json
{
	"window.title": "${activeRepositoryName}${separator}${activeFolderMedium}"
}
```

I've updated my VS Code Insiders version again just now, hoping the regression is fixed, but issue still appears.

---

Version: `1.113.0-insider`
Commit: `2b44ec5c3fcd5788a7fb6abaa231c6659018babc`
Date: `2026-03-22T18:56:52-07:00`
Electron: `39.8.3`
ElectronBuildId: `13620978`
Chromium: `142.0.7444.265`
Node.js: `22.22.1`
V8: `14.2.231.22-electron.0`
OS: `Darwin arm64 25.3.0`

---

### @eli-w-king (2026-03-23T17:51:44Z)

https://github.com/microsoft/vscode/issues/303345

---

### @benibenj (2026-03-27T10:11:06Z)

Still seeing this in insiders. Did you also push your fix there or only in the release branch?

<img width="746" height="89" alt="Image" src="https://github.com/user-attachments/assets/3669b767-3425-4b55-b161-0ed04f31478b" />

---
