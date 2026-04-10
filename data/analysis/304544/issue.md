# Issue #304544: Can't type in new welcome page

**Repository:** microsoft/vscode
**Author:** @bamurtaugh
**Created:** 2026-03-24T18:38:44Z
**Labels:** bug, verified, insiders-released

## Description

<!-- ⚠️⚠️ Do Not Delete This! feature_request_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- Please search existing issues to avoid creating duplicates. -->

<!-- Describe the feature you'd like. -->

After updating, if I try to use it in an empty workspace, the input box is too small:

<img width="2476" height="1589" alt="Image" src="https://github.com/user-attachments/assets/250a5b4f-9939-4ace-aa11-2773cba3c156" />

## Comments


### @bamurtaugh (2026-03-26T00:30:50Z)

Also reported in https://github.com/microsoft/vscode/issues/304951

---

### @kieferrm (2026-03-29T19:29:44Z)

1) add to settings.json
```
"workbench.startupEditor": "agentSessionsWelcomePage"
```
2) open a window/reload existing window
3) type in the chat input box
-> box resizes so that no text is visible

---

### @bamurtaugh (2026-03-31T16:38:45Z)

Reopening as I'm still experiencing this in the latest Insiders:

<img width="1545" height="393" alt="Image" src="https://github.com/user-attachments/assets/61679d8f-bb78-45b9-996a-1c38f3dad313" />

---

### @osortega (2026-03-31T18:24:58Z)

@bamurtaugh the new insiders just got released with 1.115.0, could you try reproducing with that version?

---

### @bamurtaugh (2026-03-31T18:50:57Z)

I can type in it now in the latest Insiders, thank you!

---
