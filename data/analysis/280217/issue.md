# Issue #269810: `loggerIpc#deregisterLogger` fails with Scheme contains illegal characters

**Repository:** microsoft/vscode
**Author:** @bpasero
**Created:** 2025-10-04T06:13:40Z
**Labels:** important, error-telemetry

## Description

Refs: https://errors.code.visualstudio.com/card?ch=f220831ea2d946c0dcb0f3eaa480eb435a2c1260&bH=76f31ebe-9cf2-d623-b3dc-613208f6d6ba

There is a very frequent bug around this call from millions of machines where the `Uri` seems to be invalid:

<img width="320" height="98" alt="Image" src="https://github.com/user-attachments/assets/8116e94d-f508-4d47-b2b8-2aa1a2d28e8c" />

https://github.com/microsoft/vscode/blob/9defb53a3bf4267858fb2a57a47cdd8c244c261f/src/vs/platform/log/electron-main/logIpc.ts#L36

The stack is hard to read but I found the location by scanning the minified code.

## Comments


### @bpasero (2025-11-30T08:41:20Z)

This keeps dominating the most errors reported per version by large margin:

<img width="1266" height="224" alt="Image" src="https://github.com/user-attachments/assets/9dbc01c9-2be4-4035-9af7-a4650ae71b2b" />

---
