# Issue #304025: Chat customization: descriptions are cut off

**Repository:** microsoft/vscode
**Author:** @aeschli
**Created:** 2026-03-23T10:32:56Z
**Labels:** bug, candidate, insiders-released

## Description

Testing #303656

Create a sub agent:
```
---
name: "test-github-agent"
description: "Test agent from .github/agents/ — verifies this discovery location is active"
---
```

Open it in the chat customization view:

![Image](https://github.com/user-attachments/assets/894d0430-548c-4f40-8a01-78aaff575cc0)

There's code that tries to only take the first sentence of a description. IMO that's problematic and might also not work for non-English locales .
I suggest to render the full description until the first end-of-line character. In the UI use Ellipses (`...`) after a certain width.

## Comments

