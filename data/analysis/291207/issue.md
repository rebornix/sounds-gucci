# Issue #290858: Don't sort sessions by read/unread state

**Repository:** microsoft/vscode
**Author:** @chrmarti
**Created:** 2026-01-27T15:23:31Z
**Labels:** bug, verified, insiders-released, chat-agents-view

## Description


Type: <b>Bug</b>

Sort them only by modification date. (Outlook and others also do this.)

<img width="664" height="995" alt="Image" src="https://github.com/user-attachments/assets/b0c8972f-411d-40c6-92ee-44dca6acc1be" />


VS Code version: Code - Insiders 1.109.0-insider (e7a06c8eabf2915e2c383b1ce6d2b993d90e2e92, 2026-01-27T07:16:53.085Z)
OS version: Darwin arm64 24.6.0

<details>
<summary>System Info</summary>

|Item|Value|
|---|---|
|CPUs|Apple M1 Max (10 x 2400)|
|GPU Status|2d_canvas: enabled<br>GPU0: VENDOR= 0x106b [Google Inc. (Apple)], DEVICE=0x0000 [ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Max, Version 15.7.3 (Build 24G419))], DRIVER_VENDOR=Apple, DRIVER_VERSION=15.7.3 *ACTIVE*<br>Machine model name: MacBookPro<br>Machine model version: 18.2<br>direct_rendering_display_compositor: disabled_off_ok<br>gpu_compositing: enabled<br>multiple_raster_threads: enabled_on<br>opengl: enabled_on<br>rasterization: enabled<br>raw_draw: disabled_off_ok<br>skia_graphite: disabled_off<br>trees_in_viz: disabled_off<br>video_decode: enabled<br>video_encode: enabled<br>webgl: enabled<br>webgl2: enabled<br>webgpu: enabled<br>webnn: disabled_off|
|Load (avg)|32, 47, 47|
|Memory (System)|64.00GB (0.10GB free)|
|Process Argv|--log trace --log github.copilot-chat=debug --crash-reporter-id 7aad610c-0e6b-48aa-ba87-b704b1b543cf|
|Screen Reader|no|
|VM|0%|

Connection to 'dev-container+7b22686f737450617468223a222f55736572732f6368726d617274692f446576656c6f706d656e742f7265706f732f736d6b747374222c226c6f63616c446f636b6572223a66616c73652c2273657474696e6773223a7b22636f6e74657874223a226465736b746f702d6c696e7578227d2c22636f6e66696746696c65223a7b22246d6964223a312c22667350617468223a222f55736572732f6368726d617274692f446576656c6f706d656e742f7265706f732f736d6b7473742f2e646576636f6e7461696e65722f646576636f6e7461696e65722e6a736f6e222c2270617468223a222f55736572732f6368726d617274692f446576656c6f706d656e742f7265706f732f736d6b7473742f2e646576636f6e7461696e65722f646576636f6e7461696e65722e6a736f6e222c22736368656d65223a2266696c65227d7d' could not be established
</details><details><summary>Extensions (75)</summary>

Extension|Author (truncated)|Version
---|---|---
tsl-problem-matcher|amo|0.6.2
claude-code|Ant|2.1.20
openmatchingfiles|bca|0.5.4
unique-lines|bib|1.0.0
devcontainer-image-convert|Bri|0.0.1
ruff|cha|2026.34.0
network-proxy-test|chr|0.0.22
regex|chr|0.6.0
esbuild-problem-matchers|con|0.0.3
vscode-eslint|dba|3.0.20
docker|doc|0.18.0
kusto|don|0.5.4
prettier-vscode|esb|12.3.0
codespaces|Git|1.18.5
copilot-chat|Git|0.37.2026012701
remotehub|Git|0.64.0
vscode-pull-request-github|Git|0.127.2026012704
gitlab-workflow|Git|6.67.3
vscode-test-explorer|hbe|2.22.1
vscode-drawio|hed|1.9.0
rest-client|hum|0.25.1
template-string-converter|meg|0.6.1
regexsnippets|Mon|1.0.2
vscode-azurefunctions|ms-|1.20.3
vscode-azureresourcegroups|ms-|0.11.7
vscode-containers|ms-|2.4.0
vscode-docker|ms-|2.0.0
vscode-language-pack-de|MS-|1.108.2026011409
vscode-language-pack-qps-ploc|MS-|1.108.2026012109
debugpy|ms-|2025.19.2026012701
python|ms-|2026.1.2026012301
vscode-pylance|ms-|2025.12.101
vscode-python-envs|ms-|1.17.10261013
jupyter|ms-|2025.10.2026010601
jupyter-hub|ms-|2024.10.1002831100
jupyter-keymap|ms-|1.1.2
jupyter-renderers|ms-|1.3.2025062701
vscode-ai|ms-|1.5.2026012208
vscode-ai-remote|ms-|1.5.2026012009
vscode-jupyter-cell-tags|ms-|0.1.9
vscode-jupyter-slideshow|ms-|0.1.6
remote-containers|ms-|0.440.0
remote-ssh|ms-|0.123.2026012215
remote-ssh-edit|ms-|0.87.0
remote-wsl|ms-|0.104.3
vscode-remote-extensionpack|ms-|0.26.0
azure-repos|ms-|0.40.0
azurecli|ms-|0.6.0
debug-value-editor|ms-|0.2.2
extension-test-runner|ms-|0.0.14
hexeditor|ms-|1.11.1
live-server|ms-|0.5.2026012601
remote-explorer|ms-|0.6.2025081809
remote-repositories|ms-|0.42.0
remote-server|ms-|1.6.2026011209
test-adapter-converter|ms-|0.2.1
ts-file-path-support|ms-|1.0.0
vscode-github-issue-notebooks|ms-|0.0.134
vscode-selfhost-test-provider|ms-|0.3.25
vscode-speech|ms-|0.16.0
vscode-speech-language-pack-de-de|ms-|0.5.0
vscode-websearchforcopilot|ms-|0.2.2026012701
web-editors|ms-|0.3.0
vscode-xml|red|0.29.2025112508
vscode-yaml|red|1.19.1
vscode-dall-toys|rob|0.5.0
rust-analyzer|rus|0.4.2768
eval|Sto|0.0.6
vscode-open-in-github|sys|1.18.0
even-better-toml|tam|0.21.2
shellcheck|tim|0.38.6
native-preview|Typ|0.20260127.1
vscode-lldb|vad|1.12.0
explorer|vit|1.38.1
autocomplete-english-word|wus|0.1.7

(1 theme extensions excluded)

</details><details>
<summary>A/B Experiments</summary>

```
vsliv368:30146709
pythonvspyt551cf:31249598
nativeloc1:31118317
dwcopilot:31158714
471b6256:31240254
dwoutputs:31242946
copilot_t_ci:31333650
g012b348:31231168
pythonrdcb7:31268811
pythonpcpt1cf:31399617
6518g693:31302842
63221493:31336333
envsactivate1:31349248
editstats-enabled:31346256
cloudbuttont:31366566
3efgi100_wstrepl:31403338
use-responses-api:31390341
je187915:31401257
linter-nes:31447379
none:31438490
cp_cls_c_966_ss:31446431
chatvisible:31417128
inlinechat_v2_hd992725:31445440
4je02754:31426859
find_all_ref_in_bg_t:31442083
ge8j1254_inline_auto_hint_haiku:31426887
a5gib710:31434435
5j92g670_sonnet:31446810
7a04d226_do_not_restore_last_panel_session:31429685
anthropic_thinking_t:31427198
406hc587_ask_agent:31428392
cp_cls_c_1081:31443829
copilot-nes-oct-trt:31432609
ia-use-proxy-models-svc:31446143
nes-slash-models-on:31441832
a43f0575b:31442821
e9c30283:31452242
c0ci8992_validated:31449878
control_6dc23131:31449957
diag_5_5:31448842
nes-trig-ctrl:31449243
edit_mode_hidden:31450404
nes-ftch-new:31451312
nes_chat_context_disabled:31451402
showstats:31452402
a607i547:31452366
0a33d263:31452872

```

</details>

<!-- generated by issue reporter -->

## Comments


### @bpasero (2026-01-28T08:21:11Z)

I am trying to be clever here to put unread sessions to the top because in this mode we only show 3 sessions expanded and thus you might find an unread session only in the "More" section that wants to tell you something.

But I do agree that this might be too clever and push up sessions to the top that are very old, so lets just always sort by recency.

Note that archived sessions will always be at the end, irrespective of their date.

---
