# Issue #291701: Agent session list collapsed automatically without interaction

**Repository:** microsoft/vscode
**Author:** @connor4312
**Created:** 2026-01-29T18:55:11Z
**Labels:** bug, confirmed, insiders-released, chat-agents-view

## Description

In this video, showing a separate bug, the agent session list collapsed between 0:20 and 0:30 even though I never interacted with it:

https://github.com/user-attachments/assets/ee493f33-01b0-4139-8ebe-f61083dcc002

## Comments


### @bpasero (2026-01-29T19:01:22Z)

Anything in the logs?

---

### @connor4312 (2026-01-29T19:36:40Z)

Just

```
 ERR TypeError: Cannot read properties of undefined (reading 'layout')
    at xT.layout (workbench.desktop.main.js:2347:3490)
    at k8.Ub (workbench.desktop.main.js:3925:11225)
    at k8.layout (workbench.desktop.main.js:3925:11109)
    at workbench.desktop.main.js:711:59008
    at qZe.W (workbench.desktop.main.js:711:59124)
    at qZe.layout (workbench.desktop.main.js:711:58994)
    at LF.layout (workbench.desktop.main.js:823:31385)
    at LF.relayout (workbench.desktop.main.js:823:31505)
    at Yie.Sc (workbench.desktop.main.js:715:57194)
    at V5e.g (workbench.desktop.main.js:715:56736)
    at V5e.execute (workbench.desktop.main.js:35:3881)
    at n (workbench.desktop.main.js:35:4124)
    at workbench.desktop.main.js:35:4295
```

(xT is the ChatListRenderer)

and 

```
Measuring item node that is not in DOM! Add ListView to the DOM before measuring row height! Error
    at SHi.Fb (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:306:28447)
    at SHi.Eb (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:306:27695)
    at SHi.Db (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:306:27136)
    at SHi.Z (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:306:15321)
    at SHi.splice (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:306:13762)
    at vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:304:96
    at Array.forEach (<anonymous>)
    at Pcs.splice (vscode-file://vscode-app/Applications/Visual%20Studio%20Code%20-%20Insiders.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:304:83)
```

which is not immediately suspect

---

### @bpasero (2026-01-29T19:49:23Z)

Maybe some list stuff, need @benibenj to consult with me.

---

### @bpasero (2026-01-30T09:51:35Z)

@connor4312 when this happens again, are these sections actually empty or can you expand them?

---

### @bpasero (2026-02-03T05:47:16Z)

I am able to reproduce with the simple steps of triggering a local chat from the chat welcome view. This then immediately shows the chat maximised with all sections collapsed.

@benibenj Looks like calling `List.updateChildren` many times without waiting for the call to finish causes this. I have a feeling this is rather a list/tree bug because that should ideally be handled by the widget and not the user of the widget, but I am pushing a fix to run multiple `updateChildren` calls through a `Throttler`.

---
