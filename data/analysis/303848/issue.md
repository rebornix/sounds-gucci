# Issue #303848: `cd CWD && ` doesn't get stripped when sandboxing is enabled

**Repository:** microsoft/vscode
**Author:** @alexdima
**Created:** 2026-03-22T12:19:07Z
**Labels:** bug, verified, insiders-released, agent-sandbox

## Description

* Try `` can you pls run `cd /Users/alex/src/vscode3 && ls -lh` ``
* when sandboxing is off this gets transformed to `ls -lh`:

<img width="454" height="160" alt="Image" src="https://github.com/user-attachments/assets/abd4fbdc-a5be-4d00-88b5-dd0cc8dfe85e" />

* this doesn't work when sandboxing is on:

<img width="466" height="165" alt="Image" src="https://github.com/user-attachments/assets/2ff793b2-cd98-4cb7-80cd-7317513832ff" />

cc @roblourens 

## Comments


### @bhavyaus (2026-03-23T18:01:42Z)

<img width="750" height="96" alt="Image" src="https://github.com/user-attachments/assets/0c0fadef-6cc9-4f69-90f1-9b066cc7400b" />

---
