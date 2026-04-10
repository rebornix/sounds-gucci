# Issue #303645: Chat image carousel shows broken images for element screenshots added with "Add Element to Chat"

**Repository:** microsoft/vscode
**Author:** @jruales
**Created:** 2026-03-20T23:45:16Z
**Labels:** bug, verified, insiders-released, browser-integration, image-carousel

## Description

<img width="1970" height="1392" alt="Image" src="https://github.com/user-attachments/assets/a4a7e10a-c245-4b11-981d-b1dadf702bac" />

Repro steps:
- Open Integrated browser, and browse to a website
- Use "Add element to chat" to add chat context, and send the message to the agent
- 🐛 Open the attached image in the image carousel. It will show as broken, despite it being attached properly to the chat message

## Comments


### @eleanorjboyd (2026-03-23T16:12:15Z)

seeing a behavior where if I use the "Add element to chat" it adds some weird padding on the img as compared to just copy an img where it doesn't have that weird boarder on the bottom and right 

https://github.com/user-attachments/assets/5daf76f4-00a2-4629-85f5-881dc804a856

---

### @eleanorjboyd (2026-03-23T16:15:08Z)

This may be a different issue as you see in the video I verified that the img is attached (ie not broken). You can decide if you want to mark this as verified and the issue I posted separate or keep this one open as the same. Thanks

---

### @jruales (2026-03-23T16:47:58Z)

@eleanorjboyd that's a different issue. Thank you so much for finding that! I have filed a bug for that here:
* https://github.com/microsoft/vscode/issues/304158

---
