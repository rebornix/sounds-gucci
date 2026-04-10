# Issue #303283: Chat tip shows again in a session after taking action on a previous chat

**Repository:** microsoft/vscode
**Author:** @cwebster-99
**Created:** 2026-03-19T18:34:37Z
**Labels:** bug, verified, insiders-released, chat-tips

## Description

I had the /create-prompt show and then ran `/create-prompt` which made the tip go away. But opening another chat session I had another tip show. We should silence tips in the session once a user takes action on another one

## Comments


### @cwebster-99 (2026-03-30T19:22:31Z)

Steps
- code-insiders --transient
- login to copilot 
- The plan agent tip should be the first tip you see 
- Click on the Plan agent action on the tip to switch to plan 
- 🐛 I see another tip appear immediately after (mine was the /create-agent tip) 

<img width="721" height="361" alt="Image" src="https://github.com/user-attachments/assets/a1297772-2d09-4af2-bc41-20176ebe8de9" />

---
