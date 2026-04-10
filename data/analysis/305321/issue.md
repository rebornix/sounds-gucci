# Issue #305321: Sessions: Can't open archived sessions (without unarchiving them)

**Repository:** microsoft/vscode
**Author:** @bamurtaugh
**Created:** 2026-03-26T21:50:24Z
**Labels:** bug, important, verified, insiders-released, agents-app

## Description

<!-- ⚠️⚠️ Do Not Delete This! feature_request_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- Please search existing issues to avoid creating duplicates. -->

<!-- Describe the feature you'd like. -->
Originally reported by @Yoyokrazy and I can repro:

- Go to archived sessions
- Click on one
- ❓ I can't actually open it (it flickers briefly and then goes back to the new session screen)
- Workaround is currently unarchiving the session (but it'd be great to just be able to preview without unarchiving)

## Comments


### @bamurtaugh (2026-03-31T16:55:19Z)

I see this is marked as insiders-released, but I'm still experiencing the issue. Is that expected?

---

### @bamurtaugh (2026-03-31T18:03:36Z)

Closing as I'm guessing this is due to https://github.com/microsoft/vscode/issues/305345#issuecomment-4164421119, and I'll re-test in the next release.

---

### @bamurtaugh (2026-03-31T18:38:00Z)

This works in the latest release, so marking as verified!

---
