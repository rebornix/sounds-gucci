# Issue #302212: Other Models experience in model dialog not a delightful screen reader experience (ctrl+alt+.).

**Repository:** microsoft/vscode
**Author:** @accesswatch
**Created:** 2026-03-16T18:07:35Z
**Labels:** bug, verified, accessibility, insiders-released

## Description


Type: <b>Bug</b>

1. Open VSCode, stable or Insiders.
2. Open Chat with ctrl+shift+i.
3. press ctrl+alt+period (.).
4. Arrow down to the "Other Models" choice.
5. Attempt to press enter to expand the Other Models list. Usae the down arrow key and notice that the list does not populate.
6. Press the spacebar on the Other Models option and then down arrow. You will see that it expands.

Expected behavior:

1. Enter and Space should allow the list to be expanded.
2. There should be a state change on Other Models to alert the screen reader user of the change in options becoming available (expanded/colapsed).

Current Outcome:

Users are confused about the state of this experience when selecting other models.


VS Code version: Code - Insiders 1.112.0-insider (6da8508c163304b57109793b1b930b737f06c5ff, 2026-03-15T21:25:08-07:00)
OS version: Windows_NT x64 10.0.26200
Modes:

<details>
<summary>System Info</summary>

|Item|Value|
|---|---|
|CPUs|13th Gen Intel(R) Core(TM) i5-1340P (16 x 2189)|
|GPU Status|2d_canvas: enabled<br>GPU0: VENDOR= 0x8086, DEVICE=0xa7a0 [Intel(R) Iris(R) Xe Graphics], DRIVER_VENDOR=Intel, DRIVER_VERSION=32.0.101.7077 *ACTIVE*<br>GPU1: VENDOR= 0x1414, DEVICE=0x008c [Microsoft Basic Render Driver], DRIVER_VERSION=10.0.26100.7309<br>Machine model name: <br>Machine model version: <br>direct_rendering_display_compositor: disabled_off_ok<br>gpu_compositing: enabled<br>multiple_raster_threads: enabled_on<br>opengl: enabled_on<br>rasterization: enabled<br>raw_draw: disabled_off_ok<br>skia_graphite: disabled_off<br>trees_in_viz: disabled_off<br>video_decode: enabled<br>video_encode: enabled<br>webgl: enabled<br>webgl2: enabled<br>webgpu: enabled<br>webnn: disabled_off|
|Load (avg)|undefined|
|Memory (System)|15.69GB (1.79GB free)|
|Process Argv|--crash-reporter-id d5b74075-e2cf-4d6c-af29-005ff3ef2fba|
|Screen Reader|yes|
|VM|0%|
</details><details><summary>Extensions (55)</summary>

Extension|Author (truncated)|Version
---|---|---
Bookmarks|ale|14.0.0
vscode-intelephense-client|bme|1.16.5
ruff|cha|2026.36.0
npm-intellisense|chr|1.4.5
vscode-markdownlint|Dav|0.61.1
vscode-eslint|dba|3.0.24
vscode-faker|dee|2.0.0
vscode-axe-linter|deq|4.11.0
githistory|don|0.6.20
EditorConfig|Edi|0.18.1
prettier-vscode|esb|12.3.0
vscode-firefox-debug|fir|2.15.0
auto-close-tag|for|0.5.15
auto-rename-tag|for|0.1.10
codespaces|Git|1.18.7
copilot-chat|Git|0.40.2026031601
remotehub|Git|0.65.2026012801
vscode-github-actions|git|0.31.0
vscode-pull-request-github|Git|0.132.0
azure-dev|ms-|0.10.0
vscode-azure-github-copilot|ms-|1.0.176
vscode-azure-mcp-server|ms-|1.0.2
vscode-azureappservice|ms-|0.26.4
vscode-azurecontainerapps|ms-|0.11.0
vscode-azurefunctions|ms-|1.20.3
vscode-azureresourcegroups|ms-|0.12.3
vscode-azurestaticwebapps|ms-|0.13.2
vscode-azurestorage|ms-|0.17.1
vscode-azurevirtualmachines|ms-|0.6.10
vscode-containers|ms-|2.4.1
vscode-cosmosdb|ms-|0.32.1
vscode-docker|ms-|2.0.0
vscode-edge-devtools|ms-|2.1.10
data-workspace-vscode|ms-|0.6.3
mssql|ms-|1.40.0
sql-bindings-vscode|ms-|0.4.1
sql-database-projects-vscode|ms-|1.5.7
vscode-pgsql|ms-|1.18.1
playwright|ms-|1.1.17
debugpy|ms-|2025.19.2026030601
mypy-type-checker|ms-|2025.3.13521012
python|ms-|2026.5.2026031201
vscode-pylance|ms-|2026.1.101
vscode-python-envs|ms-|1.23.10701011
remote-containers|ms-|0.449.0
remote-wsl|ms-|0.104.3
azure-repos|ms-|0.41.2026012801
remote-repositories|ms-|0.43.2026012801
vscode-node-azure-pack|ms-|1.8.0
vscode-speech|ms-|0.16.0
windows-ai-studio|ms-|0.32.0
code-spell-checker|str|4.6.0
vscode-ai-foundry|Tea|0.18.0
vscode-agent-plugins|tim|0.1.25
context7-mcp|Ups|1.0.1


</details><details>
<summary>A/B Experiments</summary>

```
vsliv368cf:30146710
pythonvspyt551cf:31249598
nativeloc1:31118317
dwcopilot:31158714
dwoutputs:31242946
copilot_t_ci:31333650
g012b348:31231168
pythonrdcb7:31268811
pythonpcpt1:31399616
6518g693:31302842
6abeh943:31336334
envsactivate1:31349248
editstats-enabled:31346256
cloudbuttont:31366566
3efgi100_wstrepl:31403338
839jf696:31457053
use-responses-api:31390341
cp_cls_t_966_ss:31454198
inlinechat_v2_hd992725:31445440
4je02754:31455664
7ig2g208:31429686
cp_cls_c_1081:31454833
ia-use-proxy-models-svc:31446143
a43f0575b:31442821
e9c30283:31453065
test_treatment2:31471001
g_63ac8346:31472783
idci7584:31454084
edit_mode_hidden:31453871
nes-ftch-new:31458522
nes_chat_context_disabled:31451402
e3e4d672:31454087
864ei723_large_tool_results_to_disk:31455802
showingstats:31457201
ei9d7968:31462942
b1f5h706:31455228
7ef87755:31455235
nes-extended-on:31455475
regwelcome:31461167
ce_off:31475287
nes-sp-off:31470944
de16b994:31458079
jc933416:31462667
89g7j272:31477434
7e884298:31462391
bg_compact_t:31477450
t-some:31466503
7e187181:31470441
cpptoolsoff-v2:31475362
i2gc6536:31472020
inline_hover_fd9bg283:31474549
commenticon:31473929
h08i8180:31475367
client_tst_c:31475291

```

</details>

<!-- generated by issue reporter -->

## Comments


### @accesswatch (2026-03-16T18:08:28Z)

@meganrogge Could you please review this issue and advise?

---

### @meganrogge (2026-03-16T21:05:45Z)

Agreed, `Enter` should work and we should put focus on the top item in the list when `Other Models` get opened.

---
