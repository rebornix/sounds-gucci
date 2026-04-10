# Issue #303505: Background commands don't get their output massaged with sandbox info

**Repository:** microsoft/vscode
**Author:** @isidorn
**Created:** 2026-03-20T13:32:02Z
**Labels:** bug, verified, insiders-released, agent-sandbox

## Description

https://github.com/user-attachments/assets/cae4323c-f269-40b9-a009-19b2f1ef777d

1. Follow https://github.com/microsoft/vscode-internalbacklog/issues/7145
2. Tell agent "run my app"
3. It will run `npm run dev` that fails in the sandbox, but it will never offer to run outside the sandbox

[Run_my_app_exports.tar.gz](https://github.com/user-attachments/files/26142431/Run_my_app_exports.tar.gz)

cc @dileepyavan 

## Comments


### @alexdima (2026-03-20T17:35:57Z)

Note for @dileepyavan : We saw this happen when `isBackground: true`

---

### @isidorn (2026-03-23T07:59:37Z)

This now worked. However, the issue is that when it run outside of Sandbox it did not ask for approval. Also the wrong icon was used - the terminal one with a lock. It should ideally be regular terminal icon

I will reopen

<img width="1214" height="924" alt="Image" src="https://github.com/user-attachments/assets/784f35e7-4f71-4880-8570-329319c02b55" />

Logs:

[promptCategorization_f156ea0c.copilotmd](https://github.com/user-attachments/files/26176285/promptCategorization_f156ea0c.copilotmd)

---

### @alexdima (2026-03-24T01:28:59Z)

> it did not ask for approval

this must be some auto-approval rule for `npm run dev` or something like that from your settings I believe

---

### @isidorn (2026-03-24T08:50:56Z)

Works well now. I see a nice icon. And with a fresh user data dir I am asked -> verified

<img width="543" height="177" alt="Image" src="https://github.com/user-attachments/assets/af912a03-ab04-43bf-8acc-dc9e70479ec6" />

---
