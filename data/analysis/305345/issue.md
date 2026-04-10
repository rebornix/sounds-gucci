# Issue #305345: Sessions: Model choice changes when new session starts

**Repository:** microsoft/vscode
**Author:** @bamurtaugh
**Created:** 2026-03-26T22:42:09Z
**Labels:** bug, verified, insiders-released

## Description

<!-- ⚠️⚠️ Do Not Delete This! feature_request_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- Please search existing issues to avoid creating duplicates. -->

<!-- Describe the feature you'd like. -->
- Kick off a session with model A (in my case, Opus 4.6)

<img width="1879" height="1289" alt="Image" src="https://github.com/user-attachments/assets/796dd489-7921-43fe-aa0e-03bcbab14561" />

- Session starts
- ❓ Session is now using model B (in my case, gpt-5.4, which I didn't switch to at any point)

<img width="1846" height="1535" alt="Image" src="https://github.com/user-attachments/assets/3073a1d6-353d-4b83-9a3c-65f8dc3a0843" />

This doesn't seem to happen if it's an existing session (model choice is preserved when sending messages in existing sessions).

## Comments


### @sandy081 (2026-03-26T22:59:13Z)

@bamurtaugh I am not able to reproduce this - can you please provide the exact steps?

---

### @bamurtaugh (2026-03-26T23:43:10Z)

@sandy081 here's a video, following the same steps I took above:

https://github.com/user-attachments/assets/e71492fd-602e-48c2-938f-4c693eb0af69

It seems this only happens sometimes, and I can't quite determine why. If I send a new message to a repo I've already interacted with after this latest VS Code update and that I've already changed the model on before, the model choice seems to remain consistent. So perhaps this is just a one-time side effect at this point in time after the latest update?

---

### @bamurtaugh (2026-03-27T15:24:11Z)

In the latest Insiders, I just experienced a different version of this, with a different second model (so it doesn't always switch to gpt-5.4, as it did in both cases above from yesterday), and then switching to a third model:
- I have Opus 4.6 selected for a new CLI session
- Started the session
- Model switched to 4.6 once session started working
- Once session completed and produced changes, it switched again to gpt-5.4

---

### @bamurtaugh (2026-03-31T17:35:22Z)

Reopening as I'm still experiencing this (and it sounds like others are too), this time it seems specific to consistently switching to Sonnet 4.6 after sending a new message.

---

### @hawkticehurst (2026-03-31T17:37:52Z)

Also seeing this. After sending a new message, the model be switched to Sonnet 4.6 basically every time

---

### @sandy081 (2026-03-31T18:00:17Z)

It is not yet released in insiders - There was a hick up in the morning / yesterday with insiders that it got frozen and rolled back. So please wait for latest insiders from mainIt is not yet released in insiders - There was a hick up in the morning / yesterday with insiders that it got frozen and rolled back. So please wait for latest insiders from main

---

### @bamurtaugh (2026-03-31T18:39:13Z)

This appears to work as expected for me now, so marking as verified!

---
