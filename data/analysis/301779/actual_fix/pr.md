# PR #304037: Fix dragging editor tab issue with truncated filenames

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `a12f5440566ac22bfcdb0be2130844d3592ca232`
**Parent Commit:** `46c65bcd055092c2926afa77508ae24a799df2f7`

## Description

When a file name in the editor tab bar is too long and gets truncated (tab sizing is `shrink`), dragging the tab causes parts of the tab header UI to visually move along with the dragged tab. This is because the browser uses the full tab DOM element as the drag image, which includes overflow content that produces visual artifacts.

## Changes Made

- **`multiEditorTabsControl.ts`**: In the `onDragStart` handler, when the effective tab sizing is `shrink` (either `tabSizing === 'shrink'` or a pinned/sticky tab with `pinnedTabSizing === 'shrink'`), a clean text-only drag image is used via `applyDragImage` with the editor name — the same approach already used for multi-tab drag and drop. For `fit` and `fixed` tab sizing, the existing behavior of using the tab DOM element as the drag image is preserved.

## Testing

- Open several files with long names so tab titles become truncated (set `workbench.editor.tabSizing` to `shrink`)
- Resize the VS Code window so the editor area is relatively narrow
- Click and drag one of the tabs — the drag image now shows only the file name, with no tab header UI artifacts
- Also works correctly for pinned tabs with `pinnedTabSizing` set to `shrink`
- ✅ TypeScript compilation passes cleanly

<!-- START COPILOT ORIGINAL PROMPT -->



<details>

<summary>Original prompt</summary>


----

*This section details on the original issue you should resolve*

<issue_title>Dragging editor tab when filename is truncated also drags part of the tab header UI</issue_title>
<issue_description>
Type: <b>Bug</b>

When a file name in the editor tab bar is too long and gets truncated, dragging the tab (by clicking and holding the tab header) causes the rest of the tab header UI to visually move with the dragged tab.

Instead of only the tab itself moving, additional elements from the tab header area appear to move or drag along with the file tab during the drag action.

Steps to reproduce:
1. Open several files with long names so that tab titles become truncated.
2. Resize the VS Code window so the editor area is relatively narrow.
3. Click and drag one of the tabs in the editor tab bar.
4. While dragging, observe that parts of the tab header UI visually move along with the dragged tab.

Expected behaviour:
When dragging a tab whose filename is truncated, parts of the surrounding tab header UI appear to visually drag along with the tab.

Actual behaviour:
Dragging the tab causes the tab header to visually clip or cut off other parts of the header UI.

Notes:
This is mainly noticeable when using VS Code in a narrow layout (for example split screen with a PDF and VS Code on a MacBook), where filenames are frequently truncated.

VS Code version: Code 1.111.0 (Universal) (ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb, 2026-03-06T23:06:10Z)
OS version: Darwin arm64 25.3.0
Modes:

<details>
<summary>System Info</summary>

|Item|Value|
|---|---|
|CPUs|Apple M1 Pro (8 x 2400)|
|GPU Status|2d_canvas: enabled<br>GPU0: VENDOR= 0x106b [Google Inc. (Apple)], DEVICE=0x0000 [ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Version 26.3.1 (Build 25D2128))], DRIVER_VENDOR=Apple, DRIVER_VERSION=26.3.1 *ACTIVE*<br>Machine model name: MacBookPro<br>Machine model version: 18.3<br>direct_rendering_display_compositor: disabled_off_ok<br>gpu_compositing: enabled<br>multiple_raster_threads: enabled_on<br>opengl: enabled_on<br>rasterization: enabled<br>raw_draw: disabled_off_ok<br>skia_graphite: enabled_on<br>trees_in_viz: disabled_off<br>video_decode: enabled<br>video_encode: enabled<br>webgl: enabled<br>webgl2: enabled<br>webgpu: enabled<br>webnn: disabled_off|
|Load (avg)|3, 4, 4|
|Memory (System)|16.00GB (0.45GB free)|
|Process Argv|--crash-reporter-id cb9828ef-8a2b-457c-afaf-d9fc3238b9da|
|Screen Reader|no|
|VM|0%|
</details><details><summary>Extensions (32)</summary>

Extension|Author (truncated)|Version
---|---|---
internal-browser|ahs|0.0.1
claude-code|Ant|2.1.74
markitdown-vscode|bio|0.1.1
githistory|don|0.6.20
copilot-chat|Git|0.39.0
colab|goo|0.4.1
gemini-cli-vscode-ide-companion|goo|0.20.0
overleaf-workshop|iam|0.15.7
lldb-dap|llv|0.4.1
rainbow-csv|mec|3.24.1
debugpy|ms-|2025.18.0
python|ms-|2026.4.0
vscode-pylance|ms-|2026.1.1
vscode-python-envs|ms-|1.22.0
jupyter|ms-|2025.9.1
jupyter-hub|ms-|2024.5.1002432242
jupyter-keymap|ms-|1.1.2
jupyter-renderers|ms-|1.3.0
vscode-jupyter-cell-tags|ms-|0.1.9
vscode-jupyter-slideshow|ms-|0.1.6
remote-ssh|ms-|0.122.0
remote-ssh-edit|ms-|0.87.0
live-server|ms-|0.4.17
powershell|ms-|2025.4.0
remote-explorer|ms-|0.5.0
chatgpt|ope|26.311.21342
markdown-preview-enhanced|shd|0.8.20
opencode|sst|0.0.13
swift-vscode|swi|2.16.1
pdf|tom|1.2.2
terminal-zoom|try|2.1.1
zoombar-vscode|wra|1.4.4


</details><details>
<summary>A/B Experiments</summary>

```
vsliv368cf:30146710
binariesv615:30325510
nativeloc1:31344060
dwcopilot:31170013
dwoutputs:31242946
copilot_t_ci:31333650
e5gg6876:31282496
pythonrdcb7:31342333
6518g693:31463988
aj953862:31281341
b6b4d950:31327385
6abeh943:31336334
envsdeactivate2:31464701
cloudbuttont:31379625
aihoversummaries_f:31469309
3efgi100_wstrepl:31403338
55ia6109:31457054
use-responses-api:31390855
je187915:31454425
ec5jj548:31422691
cp_cls_t_966_ss:31454198
find_all_ref_in_bg_f:31469307
ge8j1254_inline_auto_hint_haiku:31427726
nes-autoexp-10:31446583
38bie571_auto:31429954
7a04d226_do_not_restore_last_panel_session:31438103
preserve_tokens:31444546
cp_cls_c_1081:31454833
ia-use-proxy-models-svc:31452481
a43f0576c:31442824
e9c30283:31461165
test_treatment2:31471001
nes-conv-2-3:31474331
control_6dc23131:31467998
idci7584:31464702
edit_mode_hidden:31461530
864ei723_large_tool_results_to_disk:31460878
notips:31471632
ei9d7968:31458072
55364912:31471672
hg17d649:31458077
nes-extended-on:31455476
chat:31457767
8hig5102:31473806
ah:31460422
nes-rcnt-edit:31471617
8a2c4887_5_3_codex_prompt:31475326
cpptoolson-v2:31475363
4dgh1208:31471592
hover1:31474145
thinking_c:31471065
c3257622:31473910
noiconchange:31473925
nes-notsn-1:31475122

```

</details>

<!-- generated by issue reporter --></issue_description>

<agent_instructions>When tab sizing is shrink, it should not use the drag image of the tab dom element but instead just use the name of the tab similar to how it's done with the multi tab drag and drop. Also make sure to support this for pinned tabs which can also b...

</details>



<!-- START COPILOT CODING AGENT SUFFIX -->

- Fixes microsoft/vscode#301779

<!-- START COPILOT CODING AGENT TIPS -->
---

⚡ Quickly spin up Copilot coding agent tasks from anywhere on your macOS or Windows machine with [Raycast](https://gh.io/cca-raycast-docs).

## Commits

- Initial plan
- Fix drag image for shrink-sized tabs to avoid tab header UI artifacts

## Changed Files

- src/vs/workbench/browser/parts/editor/multiEditorTabsControl.ts
