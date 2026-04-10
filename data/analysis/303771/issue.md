# Issue #303771: Last image in image carousel is being zoomed

**Repository:** microsoft/vscode
**Author:** @kieferrm
**Created:** 2026-03-21T19:20:55Z
**Labels:** bug, image-carousel

## Description


Type: <b>Bug</b>

When reviewing screenshots I'm not looking at the carousel at the bottom of the viewer. I put my mouse on the "next image" button position and keep clicking. The last image though does not have the "next image" button and so when I keep clicking the image is being zoomed. It takes me always a couple of clicks to realize that I'm at the end. See https://cleanshot.com/share/9wlC3kC2

VS Code version: Code - Insiders 1.113.0-insider (6901acce9c8e11883b7426f3e8acd812230e0281, 2026-03-19T11:14:56+01:00)
OS version: Darwin arm64 25.3.0
Modes:

<details>
<summary>System Info</summary>

|Item|Value|
|---|---|
|CPUs|Apple M4 (10 x 2400)|
|GPU Status|2d_canvas: enabled<br>GPU0: VENDOR= 0x106b [Google Inc. (Apple)], DEVICE=0x0000 [ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Version 26.3.1 (a) (Build 25D771280a))], DRIVER_VENDOR=Apple, DRIVER_VERSION=26.3.1 *ACTIVE*<br>Machine model name: Mac<br>Machine model version: 16.12<br>direct_rendering_display_compositor: disabled_off_ok<br>gpu_compositing: enabled<br>multiple_raster_threads: enabled_on<br>opengl: enabled_on<br>rasterization: enabled<br>raw_draw: disabled_off_ok<br>skia_graphite: enabled_on<br>trees_in_viz: disabled_off<br>video_decode: enabled<br>video_encode: enabled<br>webgl: enabled<br>webgl2: enabled<br>webgpu: enabled<br>webnn: disabled_off|
|Load (avg)|2, 2, 2|
|Memory (System)|32.00GB (0.35GB free)|
|Process Argv|--enable-proposed-api lszomoru.lszomoru-proposed-api-sample --enable-proposed-api donjayamanne.kusto --crash-reporter-id ef10dfea-3602-4c74-ba1a-109ce7da7825|
|Screen Reader|no|
|VM|0%|
</details><details><summary>Extensions (64)</summary>

Extension|Author (truncated)|Version
---|---|---
vscode-track-build-errors|aes|0.0.3
git-branch|ale|1.7.0
tsl-problem-matcher|amo|0.6.2
claude-code|Ant|2.1.79
github-markdown-preview|bie|0.3.0
markdown-checkbox|bie|0.4.0
markdown-emoji|bie|0.3.1
markdown-footnotes|bie|0.1.1
markdown-mermaid|bie|1.32.0
markdown-preview-github-styles|bie|2.2.0
markdown-yaml-preamble|bie|0.1.0
mermaid-markdown-syntax-highlighting|bpr|1.8.0
cerebras-chat|Cer|0.1.20
vscode-opennewinstance|chr|0.0.15
esbuild-problem-matchers|con|0.0.3
vscode-svgviewer|css|2.0.0
vscode-eslint|dba|3.0.24
markdown-wysiwyg-editor|Ern|0.0.5
prettier-vscode|esb|12.4.0
graphviz-markdown-preview|gee|0.0.8
codespaces|Git|1.18.8
copilot-chat|Git|0.41.2026031902
remotehub|Git|0.65.2026031901
vscode-pull-request-github|Git|0.133.2026032004
mdmath|goe|2.7.4
rainbow-csv|mec|3.24.1
compare-folders|mos|0.28.0
vscode-language-pack-es|MS-|1.110.2026031919
black-formatter|ms-|2025.3.11831009
debugpy|ms-|2025.19.2026032001
isort|ms-|2025.1.13251007
python|ms-|2026.5.2026031201
vscode-pylance|ms-|2026.1.102
vscode-python-envs|ms-|1.23.10791016
jupyter|ms-|2025.10.2026030601
jupyter-keymap|ms-|1.1.2
jupyter-renderers|ms-|1.3.2025062701
vscode-jupyter-cell-tags|ms-|0.1.9
vscode-jupyter-slideshow|ms-|0.1.6
remote-containers|ms-|0.450.0
remote-ssh|ms-|0.123.2026031915
remote-ssh-edit|ms-|0.87.0
azure-repos|ms-|0.41.2026031901
debug-value-editor|ms-|0.2.2
hexeditor|ms-|1.11.1
js-debug-nightly|ms-|2026.3.2017
remote-explorer|ms-|0.6.2026031809
remote-repositories|ms-|0.43.2026031901
remote-server|ms-|1.6.2026022609
test-adapter-converter|ms-|0.2.1
vscode-github-issue-notebooks|ms-|0.0.134
vscode-js-profile-flame|ms-|1.0.9
vscode-markdown-notebook|ms-|0.0.26
vscode-selfhost-test-provider|ms-|0.3.25
vscode-speech|ms-|0.16.0
chatgpt|ope|26.5318.11754
material-icon-theme|PKi|5.32.0
excalidraw-editor|pom|3.9.1
vscode-xml|red|0.29.0
code-spell-checker|str|4.5.6
explorer|vit|1.48.2
codetour|vsl|0.0.61
gistfs|vsl|0.9.6
vscode-selfhost-test-provider|ms-|0.4.0

(3 theme extensions excluded)

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
ddidt:31398484
je187915:31401257
cp_cls_t_966_ss:31454198
inlinechat_v2_hd992725:31445440
8hhj4413:31478653
ge8j1254_inline_auto_hint_haiku:31426887
00h15499_gpt_53_codex:31464539
cp_cls_t_1081:31454832
conptydll_true:31480680
ia-use-proxy-models-svc:31446143
a43f0575b:31442821
e9c30283:31453065
test_treatment2:31471001
subagent_3ccgc321:31480640
idci7584:31454084
edit_mode_hidden:31453871
nes-ftch-new:31458522
nes_chat_context_enabled:31451401
e3e4d672:31454087
864ei723_large_tool_results_to_disk:31455802
showingstats:31457201
ei9d7968:31462942
534a6447:31478742
7ef87755:31455235
nes-extended-on:31455475
agentwelcome:31461166
nes-vscode-team-custom:31472622
vscode-team-custom-2:31480564
jc933416:31462667
89g7j272:31480197
hhf17803:31462392
bg_compact_t:31477450
t-some:31466503
7e187181:31470441
cpptoolsoff-v2:31475362
thinking_effort_h:31479457
i2gc6536:31472020
1g3cj959:31478603
h08i8180:31475367
client_tst_t:31481009
po_split_t:31475411
ddid_t:31478204
getcmakediagnosticson:31480155
ja75b849:31480103
jah3f675:31480084
bjc72774_agent_sandbox:31480590

```

</details>

<!-- generated by issue reporter -->

## Comments

