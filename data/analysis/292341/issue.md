# Issue #292296: Chat Anonymous: can send a chat message with anonymous access

**Repository:** microsoft/vscode
**Author:** @alexr00
**Created:** 2026-02-02T11:54:57Z
**Labels:** smoke-test-failure, insiders-released

## Description

```
1) VSCode Smoke Tests (Electron)
       Chat Anonymous
         can send a chat message with anonymous access:
     Error: Timeout: get element 'div[id="workbench.panel.chat"] .interactive-item-container.interactive-response:not(.chat-response-loading)' after 20 seconds.
      at Code.poll (D:\a\_work\1\s\test\automation\out\code.js:286:23)
      at async Code.waitForElement (D:\a\_work\1\s\test\automation\out\code.js:242:16)
      at async Chat.waitForResponse (D:\a\_work\1\s\test\automation\out\chat.js:44:9)
      at async Context.<anonymous> (out\areas\chat\chatAnonymous.test.js:24:13)

```

https://dev.azure.com/monacotools/Monaco/_build/results?buildId=400901&view=logs&j=15ec5277-fdc6-550c-b203-acb65f44f31c&t=deff7224-3715-5bbb-8e2a-beb5328e3561

## Comments

