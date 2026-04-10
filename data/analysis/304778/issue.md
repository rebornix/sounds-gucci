# Issue #304778: Problem view shows errors on missing tool names

**Repository:** microsoft/vscode
**Author:** @clovu
**Created:** 2026-03-25T14:46:41Z
**Labels:** bug, verified, verification-needed, insiders-released, chat-prompts

## Description

Issues shown in the Problems panel should be strictly related to the current project, instead of including unrelated or irrelevant noise.

<img width="1512" height="982" alt="Image" src="https://github.com/user-attachments/assets/1c2dfb8d-79d5-4d9a-b705-b55aa1d59d3d" />


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
- VS Code Version: 1.113.0 (Universal) 
- OS Version: 
  - macOS 26.4 (25E246) 
  - Darwin arm64 25.4.0

Steps to Reproduce:

1. Report issues after opening VSCode

## Comments


### @shorsman (2026-03-25T14:57:24Z)

I got these warnings too, on windows 10 / wsl2

---

### @jasonperry1231hou-lang (2026-03-25T15:53:34Z)

 Okay I understand that

On Wed, Mar 25, 2026, 9:58 AM Bas ***@***.***> wrote:

> *shorsman* left a comment (microsoft/vscode#304778)
> <https://github.com/microsoft/vscode/issues/304778#issuecomment-4127277963>
>
> I got these warnings too, on windows 10 / wsl2
>
> —
> Reply to this email directly, view it on GitHub
> <https://github.com/microsoft/vscode/issues/304778?email_source=notifications&email_token=B7VP3SOV5UW35BGRXM34Q5L4SPXZLA5CNFSNUABFM5UWIORPF5TWS5BNNB2WEL2JONZXKZKDN5WW2ZLOOQXTIMJSG4ZDONZZGYZ2M4TFMFZW63VKON2WE43DOJUWEZLEUVSXMZLOOSWGM33PORSXEX3DNRUWG2Y#issuecomment-4127277963>,
> or unsubscribe
> <https://github.com/notifications/unsubscribe-auth/B7VP3SPF5MNPURLQDCECF5L4SPXZLAVCNFSM6AAAAACW672KX2VHI2DSMVQWIX3LMV43OSLTON2WKQ3PNVWWK3TUHM2DCMRXGI3TOOJWGM>
> .
> You are receiving this because you are subscribed to this thread.Message
> ID: ***@***.***>
>

---

### @miguelmouraoo (2026-03-26T10:24:36Z)

Solved for me by installing "GitHub Pull Requests" from VS Code's Extensions tab.

---

### @gpateunissen (2026-03-26T11:27:32Z)

installed "GitHub Pull Requests" but still getting this warnings...
 (ubuntu 24.04)

---

### @miguelmouraoo (2026-03-26T11:29:42Z)

> installed "GitHub Pull Requests" but still getting this warnings... (ubuntu 24.04)

Also intalled github MCP Server: https://api.githubcopilot.com/mcp/

---

### @hgfernan (2026-03-26T12:32:42Z)

> Solved for me by installing "GitHub Pull Requests" from VS Code's Extensions tab.

Solved for me: Debian 13.

Thanks for the hint.

---

### @Rawalanche (2026-03-26T13:04:22Z)

1.113.0 is the worst update in the history of VSCode. It's the first one that broke so many things its seriously affected my ability to work to such a degree I am considering starting to look for alternatives.

---

### @Agentadam99 (2026-03-26T13:11:32Z)

GitHub Pull Requests and GitHub MCP Server installed, and have the showing still.

---

### @bernarddinatale (2026-03-26T16:21:00Z)

Installed GitHub Pull Requests then in open Extensions → use the filter icon → choose MCP Server → search github → install the GitHub MCP server → then run MCP: List Servers and check that github appears.  Now I still have one warning left: Unknown model 'Gemini 3 Flash (Preview) (copilot)'.

---

### @Xan-Kun (2026-03-26T20:35:19Z)

Just upgraded Insider, and this is getting quite out of hand 😅.
On a fresh, clean workspace, I start with 15 Problems/Warnings like this.
What can I do?

```
[{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'vscode/memory'.",
	"startLineNumber": 7,
	"startColumn": 34,
	"endLineNumber": 7,
	"endColumn": 49
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github/issue_read'.",
	"startLineNumber": 7,
	"startColumn": 51,
	"endLineNumber": 7,
	"endColumn": 70
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/issue_fetch'.",
	"startLineNumber": 7,
	"startColumn": 72,
	"endLineNumber": 7,
	"endColumn": 119
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/activePullRequest'.",
	"startLineNumber": 7,
	"startColumn": 121,
	"endLineNumber": 7,
	"endColumn": 174
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'vscode/memory'.",
	"startLineNumber": 8,
	"startColumn": 34,
	"endLineNumber": 8,
	"endColumn": 49
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github/issue_read'.",
	"startLineNumber": 8,
	"startColumn": 51,
	"endLineNumber": 8,
	"endColumn": 70
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/issue_fetch'.",
	"startLineNumber": 8,
	"startColumn": 72,
	"endLineNumber": 8,
	"endColumn": 119
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/activePullRequest'.",
	"startLineNumber": 8,
	"startColumn": 121,
	"endLineNumber": 8,
	"endColumn": 174
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'vscode/memory'.",
	"startLineNumber": 7,
	"startColumn": 34,
	"endLineNumber": 7,
	"endColumn": 49
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github/issue_read'.",
	"startLineNumber": 7,
	"startColumn": 51,
	"endLineNumber": 7,
	"endColumn": 70
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/issue_fetch'.",
	"startLineNumber": 7,
	"startColumn": 72,
	"endLineNumber": 7,
	"endColumn": 119
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/activePullRequest'.",
	"startLineNumber": 7,
	"startColumn": 121,
	"endLineNumber": 7,
	"endColumn": 174
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool or toolset 'vscode/memory'.",
	"startLineNumber": 26,
	"startColumn": 68,
	"endLineNumber": 26,
	"endColumn": 81
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool or toolset 'vscode/memory'.",
	"startLineNumber": 29,
	"startColumn": 124,
	"endLineNumber": 29,
	"endColumn": 137
},{
	"resource": "/<redacted>/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool or toolset 'vscode/memory'.",
	"startLineNumber": 65,
	"startColumn": 79,
	"endLineNumber": 65,
	"endColumn": 92
}]
```

---

### @aeschli (2026-03-27T08:52:08Z)

Please update the Copilot Chat extension to 0.41.2 and restart VS Code. This should solve the issue and no problems should show up anymore without custom agent files being opened. 

---

### @albertosantini (2026-03-27T08:59:50Z)

@aeschli Copilot Chat extension `0.41.2` is not there:

<img width="451" height="312" alt="Image" src="https://github.com/user-attachments/assets/5827deeb-b4eb-4834-adfd-11b1db0197e6" />

Ah ok, released just now! Waiting for the publishing. Thanks!

<img width="878" height="249" alt="Image" src="https://github.com/user-attachments/assets/749a9d0c-52d5-4be2-8850-529a64313636" />

---

### @cundernehr (2026-03-29T00:08:21Z)

VS Code Insiders 1.114.0-insider (00515ed0a37c34bc524916089b1449a7c805c325) with github.copilot-chat version 0.42.2026032703 is causing linters to scan files .vscode-insiders/extensions.

For example:

<img width="1273" height="347" alt="Image" src="https://github.com/user-attachments/assets/b98b82f5-bde4-48ea-b466-e8bc17bf7fc0" />

The scanning is being triggered constantly and causing high CPU load. VS Code GA does not have this issue.

---

### @cundernehr (2026-04-01T11:43:48Z)

Validated fixed with VS Code Version: 1.114.0-insider and GitHub Copilot Chat version 0.43.2026040101.

---
