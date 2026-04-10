# Issue #304034: When sandbox is on, add a link to learn more about this feature

**Repository:** microsoft/vscode
**Author:** @DonJayamanne
**Created:** 2026-03-23T10:52:34Z
**Labels:** bug, verified, insiders-released, agent-sandbox

## Description

Testing #303798

When certain commands fail to run in Sandbox, we get a new prompt to run something outside the sandbox.
Not all users might know what sandbox feature is, else it looks like something weird is going on (me as a user didn't ask for anything called `sandboxing` & not everyone reads release notes to learn about this feature)

We might want to have a way for users to learn more about what this sandboxing is and why they're getting this new prompt.
I.e. as a user i dont' know what sandbox is, its a new concept and there's nothing here telling me what it is.
Would like a `Learn more about [sandboxing](...) in documentation`

<img width="579" height="395" alt="Image" src="https://github.com/user-attachments/assets/06dd2990-4653-4fa8-81d1-b7c07bcad83f" />

## Comments


### @isidorn (2026-03-24T18:23:34Z)

@ntrogh I will link to our docs from the UI. Any ideas?
How about making 'the sandbox' undeline and clickable? Or we show on hover?

---

### @ntrogh (2026-03-24T18:25:41Z)

@isidorn Suggest to use underline and clickable - IIRC, we use that same approach for other terminal links to docs.

---

### @isidorn (2026-03-24T18:35:21Z)

Can you make me a aka.ms link 😊 

---

### @ntrogh (2026-03-24T18:40:22Z)

Here you go: https://aka.ms/vscode-sandboxing

---
