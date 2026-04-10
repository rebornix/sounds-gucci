# Issue #299224: When running sandbox, Copilot cannot access tmp

**Repository:** microsoft/vscode
**Author:** @pierceboggan
**Created:** 2026-03-04T16:26:38Z
**Labels:** bug, macos, insiders-released, agent-sandbox

## Description

<img width="343" height="442" alt="Image" src="https://github.com/user-attachments/assets/081e8637-5963-4fbc-94d9-a47d4659eae6" />

Copilot likes to write to tmp for storage rather than keeping things in Chat context. The problem with this is it totally causes Copilot when running sandbox mode to fail over.

I also get a ton of errors like this when running in sandbox mode when it tries to write to tmp:

>Sorry, your request failed. Please try again.

Copilot Request id: 8d2c4b74-5e6b-45fc-9766-e9ee75b4c979

GH Request Id: D22C:BC8B4:7A56AC:84B1AD:69A85AC5

Reason: Error on conversation request. Check the log for more details.

## Comments


### @roblourens (2026-03-05T19:16:16Z)

Steps?

<img width="512" height="831" alt="Image" src="https://github.com/user-attachments/assets/a7116f09-faa9-4032-a207-876d63d79ef4" />

---

### @dileepyavan (2026-03-05T19:28:11Z)

Verification steps:
1.  Enable terminal sandbox from chat settings.
2.  From copilot chat, type a request as "use the terminal tool to write to tmp folder as test". 

Expected Result: /tmp folder should be accessible by default without any settings update in sandbox mode.

---

### @dileepyavan (2026-03-05T19:30:46Z)

@roblourens validated this in latest insiders and it seems to work. Can you check your insiders version.

Version: 1.111.0-insider (user setup)
Commit: **9a4492fde6057a380f491fec8d5fa7c922e9d7d7**
Date: 2026-03-05T16:59:46+01:00
Electron: 39.6.0
ElectronBuildId: 13330601
Chromium: 142.0.7444.265
Node.js: 22.22.0
V8: 14.2.231.22-electron.0
OS: Windows_NT x64 10.0.26200

---

### @rzhao271 (2026-03-05T21:44:25Z)

Note: only issues with the feature-request label need the verification-needed label.

---

### @roblourens (2026-03-05T22:47:40Z)

That's what I'm doing and it's still failing, same as in my screenshot. Raymond verified it on Windows too, I'm on mac. I would suspect it's because the mac tmp dir is a symlink to a different path which is not `/tmp`

---

### @dileepyavan (2026-03-06T00:02:31Z)

Got it, its working in wsl but seems to be an issue in MAC OS. Will take a look, thanks!

---

### @mjbvz (2026-03-06T01:39:09Z)

I'm moving this to 1.112 to get the current milestone clear. If this must be in 1.111, please label it as a candidate and take it in through that process 

---

### @roblourens (2026-03-06T03:33:43Z)

@dileepyavan You merged a fix into main, thus it is shipping in 1.111

---

### @dileepyavan (2026-03-06T03:43:53Z)

> [@dileepyavan](https://github.com/dileepyavan) You merged a fix into main, thus it is shipping in 1.111

Got it, I thought the release branch is already created, thanks for updating.

---

### @roblourens (2026-03-06T18:30:25Z)

Still seeing this

<img width="520" height="394" alt="Image" src="https://github.com/user-attachments/assets/fdfd813e-a120-48b1-9bed-a0bde2be3515" />

Version: 1.111.0-insider
Commit: 5b38f1d5296b42ae51049d452362b673ff714dbe
Date: 2026-03-06T21:48:45+11:00
Electron: 39.6.0
ElectronBuildId: 13330601
Chromium: 142.0.7444.265
Node.js: 22.22.0
V8: 14.2.231.22-electron.0
OS: Darwin arm64 24.6.0

Seems to have read access but not write access

---

### @dileepyavan (2026-03-06T19:04:50Z)

@roblourens can you paste the contents of sandbox-config.json. You can click on open terminal which includes the path for the sandbox config. Can you paste those contents.

---

### @roblourens (2026-03-06T19:38:50Z)

<img width="1967" height="101" alt="Image" src="https://github.com/user-attachments/assets/d80de414-0617-4d42-85e1-5e7f216e85f4" />

```
{
	"network": {
		"allowedDomains": [],
		"deniedDomains": []
	},
	"filesystem": {
		"denyRead": [],
		"allowWrite": [
			".",
			"~/.npm",
			"/var/folders/ps/jz4h0kxs5_n_8z67tzzrvzn40000gn/T"
		],
		"denyWrite": []
	}
}
```

This has always confused me on mac. But I think the symlinked `/tmp` is different from the `/var/folders/ps` thing so maybe that's the problem here.

---

### @mjbvz (2026-03-07T00:11:32Z)

@dileepyavan Can you please clarify if this is a candidate for 1.111? Unless absolutely necessary, I'd like to push it to 1.112

---

### @dileepyavan (2026-03-07T00:58:00Z)

Sorry missed your message, yes this needs to be pushed to 1.112.0

---

### @dileepyavan (2026-03-20T06:08:54Z)

@alexdima / @chrmarti , can you validate this for mac os by adding symlink path `/tmp` here : https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService.ts#L222C6-L222C54. Currently we are already adding canonical paths, want to check with both. This is working for linux and the issue is only on mac.

---

### @alexdima (2026-03-20T17:53:24Z)

I would suggest the following fix: create alternative location for /tmp and then point $TEMPDIR to that folder and add an instruction to the prompts to ask the agent to avoid writing to /tmp

---
