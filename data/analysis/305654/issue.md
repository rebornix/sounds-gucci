# Issue #305654: [zh-hans] Copilot Chat shows “已完成 n 步骤s” in Chinese UI

**Repository:** microsoft/vscode
**Author:** @dunxuan
**Created:** 2026-03-23T12:37:14Z
**Labels:** bug, verified, insiders-released, chat

## Description

In Chinese (Simplified), Copilot Chat sometimes shows:

已完成 n 步骤s

This comes from the translation key:
chat.thinking.finished.withSteps

The current Chinese translation is:

已完成 {0} 步骤{1}

The upstream source string uses an English plural suffix pattern:

Finished with {0} step{1}

where:
- {1} is empty when the count is 1
- {1} is s when the count is greater than 1

Because the Chinese translation keeps {1} after 步骤, the UI becomes:

- 已完成 1 步骤
- 已完成 2 步骤s

This is a Chinese localization issue caused by carrying over an English plural suffix placeholder into the translated string.

This issue was drafted with GitHub Copilot based on my request.

## Comments


### @crsuzukimsft (2026-03-27T00:10:20Z)

@TylerLeonhardt  could you please review? Loc cannot simply omit the last placeholder.

---

### @TylerLeonhardt (2026-03-27T13:37:37Z)

https://github.com/microsoft/vscode/blob/bc8f9ef3d6b1398247324a586ef8d989f2111460/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts#L1150

```
localize('chat.thinking.finished.withSteps', 'Finished with {0} step{1}', this.appendedItemCount, this.appendedItemCount === 1 ? '' : 's')
```

@justschen you'll need to separate the single and pluralized versions, not just put `s` since translation can't really reason with that.

---
