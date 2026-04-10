# Issue #303844: Command labels use annoying backslashes e.g. `ls \-lh`

**Repository:** microsoft/vscode
**Author:** @alexdima
**Created:** 2026-03-22T11:22:07Z
**Labels:** bug, verified, regression, insiders-released, agent-sandbox

## Description

* with our without sandboxing
* `please run ls and show me file sizes too`


<img width="429" height="208" alt="Image" src="https://github.com/user-attachments/assets/dc55d6cc-bbfb-46b2-92e6-cf616b9ac473" />

## Comments


### @robotsnh (2026-03-22T11:23:15Z)

@alexdima Have you tried `ls -l`? It shows file sizes, though directory sizes are broken for some reason.

---

### @robotsnh (2026-03-22T11:23:49Z)

@alexdima Apologies, I misunderstood your issue.

---

### @robotsnh (2026-03-22T11:24:58Z)

@alexdima While I'm no expert, this is probably an agent-specific issue. Which agent are you using? You may be able to file an issue with the relevant company's customer support team.

---

### @alexdima (2026-03-22T11:40:28Z)

This is a regression, 1.112 doesn't have this

<img width="530" height="192" alt="Image" src="https://github.com/user-attachments/assets/e78d9a37-1ac4-4ef8-9ddd-0bc4ac8d2ef3" />

@robotsnh thanks for your help but I can manage :-)

---
