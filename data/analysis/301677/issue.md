# Do not block opening CLI sessions

Caused by: https://github.com/microsoft/vscode/pull/301598

```
raceCancellation (/Users/bpasero/Development/Microsoft/vscode-copilot-chat/src/util/vs/base/common/async.ts:98)
Mutex.acquire (/Users/bpasero/Development/Microsoft/vscode-copilot-chat/src/extension/chatSessions/copilotcli/node/copilotcliSessionService.ts:875)
CopilotCLISessionService.getSession (/Users/bpasero/Development/Microsoft/vscode-copilot-chat/src/extension/chatSessions/copilotcli/node/copilotcliSessionService.ts:541)
CopilotCLIChatSessionContentProvider.getSessionHistory (/Users/bpasero/Development/Microsoft/vscode-copilot-chat/src/extension/chatSessions/vscode-node/copilotCLIChatSessionsContribution.ts:644)
CopilotCLIChatSessionContentProvider.provideChatSessionContentForExistingSession (/Users/bpasero/Development/Microsoft/vscode-copilot-chat/src/extension/chatSessions/vscode-node/copilotCLIChatSessionsContribution.ts:567)
await (Unknown Source:0)
provideChatSessionContent (/Users/bpasero/Development/Microsoft/vscode-copilot-chat/src/extension/chatSessions/vscode-node/copilotCLIChatSessionsContribution.ts:482)
$provideChatSessionContent (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:521)
_doInvokeHandler (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:407)
_invokeHandler (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:407)
_receiveRequest (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:407)
_receiveOneMessage (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:407)
<anonymous> (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:407)
_deliver (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:403)
fire (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:403)
fire (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:405)
<anonymous> (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:810)
_deliver (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:403)
fire (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:403)
fire (/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:405)
```