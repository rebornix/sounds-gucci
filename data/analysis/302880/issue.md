# Issue #302880: Problems panel showing problems from Copilot configuration files

**Repository:** microsoft/vscode
**Author:** @RobertOstermann
**Created:** 2026-03-18T16:08:16Z
**Labels:** bug

## Description


Type: <b>Bug</b>

I am seeing `36` problems in the problems panel. These are all problems from the github copilot extension having an `unknown tool` warning in the global storage files.

```json
[{
	"resource": "/Users/{user}/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'web'.",
	"startLineNumber": 7,
	"startColumn": 27,
	"endLineNumber": 7,
	"endColumn": 32
}]
```

<img width="1535" height="230" alt="Image" src="https://github.com/user-attachments/assets/9f9dfb5b-5169-4e49-8d22-2134c39cfd07" />

I believe this was introduced in the latest update as I did not see these problems before updating today.

VS Code version: Code - Insiders 1.113.0-insider (Universal) (c0c11c580107f87e916316b4dc13d43d31cb80e3, 2026-03-18T14:12:19Z)
OS version: Darwin arm64 25.3.0
Modes:

<details>
<summary>System Info</summary>

|Item|Value|
|---|---|
|CPUs|Apple M4 Pro (12 x 2400)|
|GPU Status|2d_canvas: enabled<br>GPU0: VENDOR= 0x106b [Google Inc. (Apple)], DEVICE=0x0000 [ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Version 26.3.1 (a) (Build 25D771280a))], DRIVER_VENDOR=Apple, DRIVER_VERSION=26.3.1 *ACTIVE*<br>Machine model name: Mac<br>Machine model version: 16.8<br>direct_rendering_display_compositor: disabled_off_ok<br>gpu_compositing: enabled<br>multiple_raster_threads: enabled_on<br>opengl: enabled_on<br>rasterization: enabled<br>raw_draw: disabled_off_ok<br>skia_graphite: enabled_on<br>trees_in_viz: disabled_off<br>video_decode: enabled<br>video_encode: enabled<br>webgl: enabled<br>webgl2: enabled<br>webgpu: enabled<br>webnn: disabled_off|
|Load (avg)|3, 3, 4|
|Memory (System)|24.00GB (0.08GB free)|
|Process Argv|--log info --crash-reporter-id c44dbb81-faad-4a28-91b9-73596549599f|
|Screen Reader|no|
|VM|0%|
</details><details><summary>Extensions (90)</summary>

Extension|Author (truncated)|Version
---|---|---
csharp-to-typescript|adr|1.12.1
namespace|adr|1.1.2
git-skip|alc|0.6.0
nugetpackagemanagergui|ali|2.1.1
vscode-tailwindcss|bra|0.14.29
simple-react-snippets|bur|1.2.8
npm-intellisense|chr|1.4.5
path-intellisense|chr|2.10.0
vscode-css-modules|cli|0.5.4
package-json-upgrade|cod|3.5.1
csharpier-vscode|csh|10.0.1
postcss|css|1.0.9
dbclient-jdbc|cwe|1.4.6
vscode-eslint|dba|3.0.24
dbcode|dbc|1.29.2
docker|doc|0.18.0
githistory|don|0.6.20
python-environment-manager|don|1.2.7
vscode-sqlfluff|dor|3.7.0
vscode-dictionary-syntax|dun|1.0.0
gitlens|eam|17.11.1
EditorConfig|Edi|0.18.1
prettier-vscode|esb|12.4.0
vscode-expo-tools|exp|1.6.2
code-runner|for|0.12.2
csharp-format-usings|gao|0.0.4
lintlens|ghm|7.5.0
copilot-chat|Git|0.41.2026031804
remotehub|Git|0.64.0
vscode-github-actions|git|0.31.0
go|gol|0.52.2
gc-excelviewer|Gra|4.2.65
vscode-graphql-syntax|Gra|1.3.8
todo-tree|Gru|0.0.226
path-autocomplete|ion|1.25.0
svg|joc|1.5.4
lldb-dap|llv|0.4.1
i18n-ally|lok|2.13.1
rainbow-csv|mec|3.24.1
template-string-converter|meg|0.6.1
git-graph|mhu|1.30.0
emoji-icons|mig|1.6.1
dotenv|mik|1.0.1
vscode-scss|mrm|0.10.0
language-gettext|mro|0.5.0
vscode-azureappservice|ms-|0.26.4
vscode-azureresourcegroups|ms-|0.12.3
vscode-containers|ms-|2.4.1
csdevkit|ms-|2.13.9
csharp|ms-|2.131.79
vscode-dotnet-runtime|ms-|3.0.0
autopep8|ms-|2025.3.13231724
black-formatter|ms-|2025.3.11831009
debugpy|ms-|2025.18.0
pylint|ms-|2025.3.12271016
python|ms-|2026.4.0
vscode-pylance|ms-|2026.1.1
vscode-python-envs|ms-|1.23.10701013
jupyter-keymap|ms-|1.1.2
jupyter-renderers|ms-|1.3.0
vscode-jupyter-cell-tags|ms-|0.1.9
vscode-jupyter-slideshow|ms-|0.1.6
remote-containers|ms-|0.450.0
remote-ssh|ms-|0.122.0
remote-ssh-edit|ms-|0.87.0
remote-wsl|ms-|0.104.3
hexeditor|ms-|1.11.1
remote-explorer|ms-|0.5.0
remote-repositories|ms-|0.42.0
vscode-react-native|msj|1.13.0
indent-rainbow|ode|8.3.1
vscode-jest|Ort|6.4.4
vscode-versionlens|pfl|1.26.0
zodschema-generator|psu|1.0.0
vscode-xml|red|0.29.0
vscode-yaml|red|1.22.2026031708
command-variable|rio|1.69.0
better-status-bar|Rob|1.1.0
inline-parameters-extended|Rob|1.3.5
vscode-codesnap-extended|Rob|1.0.3
vscode-search-everywhere|Rob|0.1.1
jinjahtml|sam|0.20.0
vscode-sqlfluff|sql|4.0.1
git-prefix|srm|1.3.3
lua|sum|3.17.1
swift-vscode|swi|2.16.1
snippets|tah|4.0.0
es6-string-html|Tob|2.17.0
dotnetwatchattach|Tro|0.2.7
vscode-icons|vsc|12.17.0


</details><details>
<summary>A/B Experiments</summary>

```
vsliv368:30146709
pythonvspyt551:31249597
nativeloc1:31118317
dwcopilot:31158714
dwoutputs:31242946
copilot_t_ci:31333650
g012b348:31231168
pythonrdcb7:31268811
pythonpcpt1cf:31399617
6518g693:31302842
6abeh943:31336334
envsactivate1:31349248
editstats-enabled:31346256
cloudbuttont:31366566
3efgi100_wstrepl:31403338
55ia6109:31457054
use-responses-api:31390341
je187915:31401257
cp_cls_t_966_ss:31454198
inlinechat_v2_hd992725:31445440
c3h7c220:31478652
ge8j1254_inline_auto_hint_haiku:31426887
38bie571_auto:31478677
7ig2g208:31429686
cp_cls_c_1081:31454833
ia-use-proxy-models-svc:31446143
core-renderer-profiling-on:31440366
a43f0576c:31442820
e9c30283:31453065
test_treatment2:31471001
h_5b0j5247:31472782
idci7584:31454084
edit_mode_hidden:31453871
nes-ftch-ctrl:31458523
nes_chat_context_enabled:31451401
e3e4d672:31454087
864ei723_large_tool_results_to_disk:31455802
showingstats:31457201
ei9d7968:31462942
534a6447:31478742
hg17d649:31455236
nes-extended-on:31455475
agentwelcome:31461166
nes-sp-off:31470944
quick_suggest_off_75197330:31462668
89g7j272:31477434
hhf17803:31462392
bg_compact_t:31477450
t-some:31466503
dfc2j404:31470440
cpptoolsoff-v2:31475362
i2gc6536:31472020
inline_hover_fd9bg283:31474549
commenticon:31473929
h08i8180:31475367
23c7c724:31479118
client_tst_t:31475292
po_com_t:31475410
ddid_t:31478204
89j73686:31478750

```

</details>

<!-- generated by issue reporter -->

## Comments


### @tstager (2026-03-18T16:59:27Z)

The Azure Copilot extension configuration files also have unrecognized tools and other errors in the .md files for agent configuration after this last update.

---

### @jschmdt (2026-03-18T17:34:24Z)

For me its the "Ask, Explore & Plan"-Agents. On Vscode 1.113.0-insider & macOS 25.3.1 (latest) – noticed since last update, too.

<img width="742" height="267" alt="Image" src="https://github.com/user-attachments/assets/8417fe8c-a8ab-4b09-802e-2398c892c62f" />

Version: 1.113.0-insider
Commit: c0c11c580107f87e916316b4dc13d43d31cb80e3
Date: 2026-03-18T14:12:19Z (3 hrs ago)
OS: Darwin arm64 25.3.0
```json

[{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/issue_fetch'.",
	"startLineNumber": 7,
	"startColumn": 72,
	"endLineNumber": 7,
	"endColumn": 119
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/ask-agent/Ask.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/activePullRequest'.",
	"startLineNumber": 7,
	"startColumn": 121,
	"endLineNumber": 7,
	"endColumn": 174
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown model 'Gemini 3 Flash (Preview) (copilot)'.",
	"startLineNumber": 5,
	"startColumn": 39,
	"endLineNumber": 5,
	"endColumn": 75
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/issue_fetch'.",
	"startLineNumber": 8,
	"startColumn": 72,
	"endLineNumber": 8,
	"endColumn": 119
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/activePullRequest'.",
	"startLineNumber": 8,
	"startColumn": 121,
	"endLineNumber": 8,
	"endColumn": 174
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/issue_fetch'.",
	"startLineNumber": 7,
	"startColumn": 72,
	"endLineNumber": 7,
	"endColumn": 119
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool 'github.vscode-pull-request-github/activePullRequest'.",
	"startLineNumber": 7,
	"startColumn": 121,
	"endLineNumber": 7,
	"endColumn": 174
},{
	"resource": "/Users/[USERNAME]/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/plan-agent/Plan.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown tool or toolset 'vscode/memory.'.",
	"startLineNumber": 26,
	"startColumn": 68,
	"endLineNumber": 26,
	"endColumn": 82
}]
```

---

### @aeschli (2026-03-19T08:38:44Z)

@digitarald Given that github.vscode-pull-request-github is an optional extension, we should maybe replace this with a skill?

---

### @insilications (2026-03-19T10:14:14Z)

Since the last update tonight (2026-03-19):

```
Version: 1.113.0-insider
Commit: 2dbf75db76e839a94fc6997a707648dd68d07bb9
Date: 2026-03-18T21:29:18-07:00
Electron: 39.8.3
ElectronBuildId: 13586709
Chromium: 142.0.7444.265
Node.js: 22.22.1
V8: 14.2.231.22-electron.0
OS: Linux x64 6.5.3-1358.native
```

<img width="664" height="361" alt="Image" src="https://github.com/user-attachments/assets/4e0fab7d-7bc3-41f9-9cde-ebf2c6eabf91" />

---

### @nicok1 (2026-03-19T14:15:05Z)

I wanted to open my own issue for this. I am currently experiencing it with the latest VS Code Insiders version as well. It’s not a disaster, just a bit annoying.

---

### @RobertOstermann (2026-03-19T14:18:09Z)

This wouldn't be a big annoyance if we had the ability to filter out problems before they appear using settings. I tried creating an issue for that as well, but it was closed as duplicate for some reason: https://github.com/microsoft/vscode/issues/302879

---

### @digitarald (2026-03-19T15:32:01Z)

@aeschli could we somehow mark tools as optional. We'd want more planning tools depending on the environment.

How would the skill help with this, if the agent restricts the tools on its top-level? I'd assume the skill could not just enable more tools in an agent?

---

### @aeschli (2026-03-20T16:02:40Z)

The skill could be about how to find the active pull request. I think its about finding a PR that uses the same branch as the currently active branch.

Another skill could be about how to fetch and read github issues via the `web` tool. But maybe the models already know how to do that.

---

### @digitarald (2026-03-20T19:11:14Z)

> The skill could be about how to find the active pull request. I think its about finding a PR that uses the same branch as the currently active branch.

A skill finding the active PR still needs a specific tool or terminal access. If an agent intentionally limits tool access (like Plan), any skills it uses would run under these constrains.

My suggestion would be: agents and skills can have tools defined that are optional, and require some additional dependency that the agent help the user to install. We should allow optional tool dependencies that don't cause warnings. 

Scenarios:
- Plan mode can be multi-repo aware are use GitHub or AzDo tools depending on the repo.
- Our Data agent right now has kusto tools listed, allowing both Azure MCP and the kusto explorer extension. But it also checks if the extension is installed and otherwise prompts the user to do it.

We also don't validate if allow-listed CLI tools are available on the user machine.

---

### @aeschli (2026-03-22T16:48:28Z)

At runtime we already ignore all tools that we don't know, so basically we already have optional tools. The question is, should  the editor warn about tools that we don't know? We could change the severity to info instead of a warning, and I'm not sure if maybe these errors can still show up in the problem view.
Still, for the two prompts that we have here, the active pull request and issue fetch, I think we could really work around these without a need to reference external tools. 
If pull request would be a good candidate to have expense information in each prompt. 

---

### @houmark (2026-03-25T05:00:55Z)

This one is quite annoying and it's polluting my problems tab.

I'm not going to comment on if it should be a skill, but an extension, even though it's potentially an official extension also by GitHub and Microsoft, should not create this type of noise, because it's pushing down other more important issues in my workspace that might therefore get missed.

As the most simple workaround, without modifying the files, I attempted to install the GitHub Pull Requests extension, but I'm still left with one issue in three different files (github/issue_read). So two steps forward, one step back?

---

### @PillarsZhang (2026-03-25T08:30:18Z)

> This one is quite annoying and it's polluting my problems tab.
> 
> I'm not going to comment on if it should be a skill, but an extension, even though it's potentially an official extension also by GitHub and Microsoft, should not create this type of noise, because it's pushing down other more important issues in my workspace that might therefore get missed.
> 
> As the most simple workaround, without modifying the files, I attempted to install the GitHub Pull Requests extension, but I'm still left with one issue in three different files (github/issue_read). So two steps forward, one step back?

It looks like `github/issue_read` is provided by the GitHub MCP Server, and you can find it in the extension via `@mcp`.

---

### @houmark (2026-03-25T08:32:59Z)

> It looks like `github/issue_read` is provided by the GitHub MCP Server, and you can find it in the extension via `@mcp`.

Thanks for the hint, but I really don't want another MCP server as its tools will add to the context on every request. I hope this can be fixed pretty soon.

---

### @insilications (2026-03-25T08:49:58Z)

Very annoying. Do we really have to install `GitHub MCP Server` and `GitHub Pull Requests` extensions?

---

### @giancarloerra (2026-03-25T15:22:17Z)

Very annoying bug indeed.

---

### @RobertOstermann (2026-03-25T15:42:16Z)

@digitarald @aeschli Is there any progress on a fix for this? Having to install other extensions to remove problems from the problems panel is not ideal. Personally I would love to see a permanent way to filter out problems from the problems panel, such as a `"problems.exclude"` json setting.

---

### @houmark (2026-03-25T18:11:02Z)

A JSON configuration is obviously a good last resort, but these types of things should really be automatically handled by the system detecting dynamically what you have and what you don't have installed, in order to not rely on the user having to configure this type of stuff. 

At the very least, it should be possible to right click and add to ignore and that would create the JSON configuration to ignore this type of warning.

---

### @n-r-w (2026-03-25T18:55:16Z)

Now in release version. What do QA do?!

---

### @nicok1 (2026-03-25T19:29:43Z)

This PR is intended to fix this issue: https://github.com/microsoft/vscode/pull/304872

---

### @dialogaiahub (2026-03-25T21:34:31Z)

Also reproducing on 1.113.0 Stable (Windows 11) after today's update. A few additional observations:

1-Started worse, initially each of the 3 agent files (Ask.agent.md, Explore.agent.md, Plan.agent.md) showed 3 warnings each (github/issue_read, github.vscode-pull-request-github/issue_fetch, github.vscode-pull-request-github/activePullRequest). Installing GitHub Pull Requests resolved the last two, leaving only github/issue_read unresolved.

2-Duplicate entries — each affected file appears twice in the Problems panel under different URI schemes (vscode-userdata:// and file:///), effectively doubling the warning count (6 instead of 3).

3-Not fixable manually, deleting the globalStorage/github.copilot-chat folder doesn't help. VS Code regenerates the files on next launch with the same tool references, bringing all warnings back immediately.

![Image](https://github.com/user-attachments/assets/a47ff80e-ba92-40ba-b3e7-4fa687afe757)

Was not present before updating to 1.113.0.

---

### @n-r-w (2026-03-26T06:00:54Z)

Temporary solution for MacOS:

1. Edit the files
2. Set them to Locked by right-clicking -> Get Info

---

### @harlenkens (2026-03-26T07:55:34Z)

I am experiencing this same issue on Windows. My Problems panel is currently cluttered with multiple 'unknown tool' warnings stemming from Copilot configuration files, which makes it difficult to track actual code errors.

Environment:
- OS: Windows 10/11 [Specify your version]
- VS Code Version: [e.g., 1.97.0]
- Copilot Extension Version: [e.g., v1.250.0]

Is there a known temporary workaround for Windows users to ignore these specific configuration files or hide these warnings from the Problems panel until a fix is released

---

### @clemeno (2026-03-26T08:58:14Z)

`github/issue_read` can be provided by the github MCP

<img width="598" height="841" alt="Image" src="https://github.com/user-attachments/assets/7c420e6a-3357-497e-8d3d-5e841580c6b7" />

---

### @aeschli (2026-03-26T10:35:30Z)

Two issue here:
- the problem view should only show problems for the files open in an editor: Fix on the way: https://github.com/microsoft/vscode/pull/304872
- our built-in agents should not reference tools that don't come out of the box

---

### @y4sin3 (2026-03-26T10:35:30Z)

> Is there a known temporary workaround for Windows users to ignore these specific configuration files or hide these warnings from the Problems panel until a fix is released

I have edited these .md files and marked them as "read-only" to prevent them from being restored.

---

### @DanTup (2026-03-26T11:19:33Z)

@aeschli if we manually delete these tools from the prompt files, will that cause any future problems? (it's annoying to have these show up all the time in all workspaces)

---

### @Emaro (2026-03-26T13:07:36Z)

I'm also experiencing this issue and honestly I'm a bit shocked by this. VS Code was a tool in the past that went out of the way so I could focus on my work.

I'm not even using Copilot and now have to deal with reported "Problems" in files I didn't create, didn't request, I don't use and I can't filter out the problems without disabling displaying them entirely.

---

### @pcw3 (2026-03-26T13:19:58Z)

> I'm not even using Copilot and now have to deal with reported "Problems" in files I didn't create, didn't request

Quite. This issue was found in an -insiders release. The whole point of that release is that problems can be found, reported and fixed, and never reach the main release. This is not the first time something like this has happened.

Are we to think that the VSCode developers have not seen this issue for themselves?

---

### @atarek-akn (2026-03-26T13:23:43Z)

Latest insider build on windows `1.114.0-insider (bc8f9ef3d6b1398247324a586ef8d989f2111460)` 
I’m experiencing a large number of errors in the Problems tab related to unknown tools and deprecated tool attributes.

<img width="1518" height="1061" alt="Image" src="https://github.com/user-attachments/assets/bbf46365-e66e-4c73-b8e1-f9219eee41f4" />

---

### @thomak-dev (2026-03-26T14:06:37Z)

How does a bug already known in an older insiders release make it into the release?

---

### @joseavm-cmg (2026-03-26T14:24:42Z)

Same problem. after update

---

### @Seefer (2026-03-26T15:55:51Z)

This issue is manifesting in my VS Code project too. Tried logging out of my CoPilot Pro account and back in but the errors persist. Checked the Github CoPilot Chat extension details and it's version `0.41.1` and it also shows the extension was updated 53 minutes ago.

 
<img width="1036" height="321" alt="Image" src="https://github.com/user-attachments/assets/fbe384db-66d4-4970-bdca-23aca2845bd0" />

---

### @dkmstr (2026-03-26T15:58:30Z)

I got same problems, downgraded code to 1.112.0 and for now, the problem is gone (also restored copilot chat to 0.40.1).

---

### @westthomas-dev (2026-03-26T16:07:27Z)

I'm not sure it's helpful given there are so many examples, but I too have seen it after an update today.

---

### @bernarddinatale (2026-03-26T16:30:46Z)

> This issue is manifesting in my VS Code project too. Tried logging out of my CoPilot Pro account and back in but the errors persist. Checked the Github CoPilot Chat extension details and it's version `0.41.1` and it also shows the extension was updated 53 minutes ago.
> 
> <img alt="Image" width="1036" height="321" src="https://private-user-images.githubusercontent.com/129484/569876871-fbe384db-66d4-4970-bdca-23aca2845bd0.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzQ1NDI3NTUsIm5iZiI6MTc3NDU0MjQ1NSwicGF0aCI6Ii8xMjk0ODQvNTY5ODc2ODcxLWZiZTM4NGRiLTY2ZDQtNDk3MC1iZGNhLTIzYWNhMjg0NWJkMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMzI2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDMyNlQxNjI3MzVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zMGMxZGRjNzk4MjAzMmRhMzM0NzMyYWM0MTU3MWZhNjExY2ZhZjcyMTlhNDYzMTFmNWNiMzM0NzI2MTk2YTg0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.kT67dXLDKewX0uJgBxbdGzqOgybOLV6IAKvWMBDBx1c">

Installed GitHub Pull Requests then in open Extensions → use the filter icon → choose MCP Server → search github → install the GitHub MCP server → then run MCP: List Servers and check that github appears.

---

### @Mayokc (2026-03-26T17:11:48Z)

> > This issue is manifesting in my VS Code project too. Tried logging out of my CoPilot Pro account and back in but the errors persist. Checked the Github CoPilot Chat extension details and it's version `0.41.1` and it also shows the extension was updated 53 minutes ago.
> > <img alt="Image" width="1036" height="321" src="https://private-user-images.githubusercontent.com/129484/569876871-fbe384db-66d4-4970-bdca-23aca2845bd0.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzQ1NDI3NTUsIm5iZiI6MTc3NDU0MjQ1NSwicGF0aCI6Ii8xMjk0ODQvNTY5ODc2ODcxLWZiZTM4NGRiLTY2ZDQtNDk3MC1iZGNhLTIzYWNhMjg0NWJkMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMzI2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDMyNlQxNjI3MzVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zMGMxZGRjNzk4MjAzMmRhMzM0NzMyYWM0MTU3MWZhNjExY2ZhZjcyMTlhNDYzMTFmNWNiMzM0NzI2MTk2YTg0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.kT67dXLDKewX0uJgBxbdGzqOgybOLV6IAKvWMBDBx1c">
> 
> Installed GitHub Pull Requests then in open Extensions → use the filter icon → choose MCP Server → search github → install the GitHub MCP server → then run MCP: List Servers and check that github appears.

This works for me, thanks

---

### @parhamkebria (2026-03-26T17:49:58Z)

every time I open the VSCode, I see three permanent errors in the PROBLEMS tab of the built-in terminal: 

```bash
AppData\Roaming\Code\User\globalStorage\github.copilot-chat\ask-agent
Unknown tool 'github/issu_read'
AppData\Roaming\Code\User\globalStorage\github.copilot-chat\explore-agent
Unknown tool 'github/issu_read'
AppData\Roaming\Code\User\globalStorage\github.copilot-chat\plan-agent
Unknown tool 'github/issu_read'
```

None of the solution has worked so far, including those found on different threads:

- correcting the actual .md files by removing the unknown tool.
- Remove-Item "AppData\Roaming\Code\User\globalStorage\github.copilot-chat\toolEmbeddingsCache.bin" -Force

---

### @manugpri (2026-03-26T18:36:25Z)

> > This issue is manifesting in my VS Code project too. Tried logging out of my CoPilot Pro account and back in but the errors persist. Checked the Github CoPilot Chat extension details and it's version `0.41.1` and it also shows the extension was updated 53 minutes ago.
> > <img alt="Image" width="1036" height="321" src="https://private-user-images.githubusercontent.com/129484/569876871-fbe384db-66d4-4970-bdca-23aca2845bd0.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzQ1NDI3NTUsIm5iZiI6MTc3NDU0MjQ1NSwicGF0aCI6Ii8xMjk0ODQvNTY5ODc2ODcxLWZiZTM4NGRiLTY2ZDQtNDk3MC1iZGNhLTIzYWNhMjg0NWJkMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMzI2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDMyNlQxNjI3MzVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zMGMxZGRjNzk4MjAzMmRhMzM0NzMyYWM0MTU3MWZhNjExY2ZhZjcyMTlhNDYzMTFmNWNiMzM0NzI2MTk2YTg0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.kT67dXLDKewX0uJgBxbdGzqOgybOLV6IAKvWMBDBx1c">
> 
> Installed GitHub Pull Requests then in open Extensions → use the filter icon → choose MCP Server → search github → install the GitHub MCP server → then run MCP: List Servers and check that github appears.

This worked for me too. Seems that having Extension "Github Pull Requests" and "Github MCP Server" are now prerequisites for Copilot (which were not there before... at least with any noticeable problem).

---

### @dan-collins-dev (2026-03-26T18:42:26Z)

For those who don't use co-pilot and want the errors to go away, uninstalling the extension and restarting VS Code fixed the issue for me. 

---

### @dialogaiahub (2026-03-26T19:02:10Z)

Update: All warnings are now fully resolved. As mentioned in my previous comment, installing GitHub Pull Requests from the Extensions marketplace fixed github.vscode-pull-request-github/issue_fetch and github.vscode-pull-request-github/activePullRequest. The remaining github/issue_read was resolved by browsing the @mcp category in the Extensions view, searching for GitHub, and installing the GitHub MCP Server extension. All three warnings across the agent files are gone.

---

### @jtsom-do (2026-03-26T19:05:39Z)

We shouldn't have to install unnecessary and/or unwanted extensions just to remove extraneous warnings. More extensions, mean slower performance for the CODE EDITOR that I want. I don't write Python, so I don't have any extra python extensions installed...

---

### @jascomp (2026-03-26T20:05:33Z)

I already had the MCP extensions installed, but I had to reauthenticate them in order to clear the indicators.  So I guess technically it WAS a problem.

---

### @bladerunner2020 (2026-03-26T22:35:37Z)

> Temporary solution for MacOS:
> 
> 1. Edit the files
> 2. Set them to Locked by right-clicking -> Get Info

Thanks!!!! I have finally gotten rid of the annoying messages!

---

### @jelenajansson (2026-03-26T23:57:24Z)

I am having the same issues, also with this which I didn't seem to resolve by installing anything mentioned above. Additionally, when I manually delete things, it just pops back up. 

```
[{
	"resource": "/Library/Application Support/Code/User/globalStorage/github.copilot-chat/explore-agent/Explore.agent.md",
	"owner": "prompts-diagnostics-provider",
	"severity": 4,
	"message": "Unknown model 'Gemini 3 Flash (Preview) (copilot)'.",
	"startLineNumber": 5,
	"startColumn": 39,
	"endLineNumber": 5,
	"endColumn": 75
}]
```

---

### @piyushyadav0191 (2026-03-27T03:36:56Z)

I just uninstalled copilot and now my mind is clear as problems tabs

---

### @ODAncona (2026-03-27T08:28:47Z)

Upvoting the need for a fix that doesn't require installing additional extensions. As a user with a custom AI stack, I shouldn't have to install the 'GitHub Pull Requests' or 'MCP Server' extensions just to silence validation errors from internal Copilot configuration files that I don't use.

The core issue here is that VS Code's diagnostics provider is leaking internal extension metadata into the user's Problems panel. Looking forward to the fix that treats these as truly optional/ignored tools.

Copilot was great as autocompletion tool. Why duplicate the capabilities of codex, claude code, open code, cline, aider, goose and many more tools ? 

---

### @salgiza (2026-03-27T09:26:47Z)

And installing the GitHub extensions (that we don't need because we use DevOps) would only solve it if we didn't have any other extensions (Azure Tools, I'm looking at you) that raised extra errors due to this problem:

<img width="1473" height="316" alt="Image" src="https://github.com/user-attachments/assets/ac4ed101-f3e1-4811-8619-bccb97af7f55" />

I guess this is a good chance for MS to fix all the Copilot-related errors in their extensions...

---

### @aeschli (2026-03-27T09:41:21Z)

Please update the Copilot Chat extension to 0.41.2 to avoid the issue. A restart of VS Code might be needed too.

---
