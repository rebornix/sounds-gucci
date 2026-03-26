# "Ask for Edits" shows up even if you have "Disable AI Features" enabled

Type: <b>Bug</b>

- Enable "Disable AI Features"
- Select some text
- You will see "Ask for Edits". Clicking on it will do nothing.

VS Code version: Code 1.111.0 (Universal) (ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb, 2026-03-06T23:06:10Z)
OS version: Darwin arm64 24.6.0

<img width="602" height="130" alt="Image" src="https://github.com/user-attachments/assets/d01eb0f5-8ba9-43d1-ad3b-3e0dd6c4f2d1" />

<img width="853" height="111" alt="Image" src="https://github.com/user-attachments/assets/85de553a-00dc-4243-af7d-1d1c11f11186" />

Related to https://github.com/microsoft/vscode/issues/283174 (AI features keep forgetting about this option)


---

Disabling the feature specifically for it still works.

<img width="927" height="297" alt="Image" src="https://github.com/user-attachments/assets/1c80e35c-f9df-428d-9001-e388805ff4bd" />