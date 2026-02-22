# PR #285610: Do not assume stdio fields to be defined when spawning a child process.

**Repository:** microsoft/vscode
**Labels:** git
**Merge Commit:** `3cb01d979b2ff5cae28f33df264bcabc46d49d8c`
**Parent Commit:** `b87990a91ce45af766a41e960321d77d7438e710`

## Description

Fixes #145504
Fixes #145505

According to child_process documentation, when the process cannot be spawned stdin/stdout/stderr will be null. Although this is probably a rare case, we should handle that case gracefully.

## Commits

- Do not assume stdout/stderr are defined when spawning a child process.
- Add more stdio checks when spawning git processes.
- Merge branch 'main' into dev/dmitriv/git-spawn-stdio-null

## Changed Files

- extensions/git/src/git.ts
- extensions/git/src/repository.ts
