# PR #304686: Fix wrapped title spacing on the agent sessions welcome page

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `6a12c4553b4fa16d6ff344682b3bdca0ce0fcbf2`
**Parent Commit:** `783e24aa1fe8c38f2083863b27aa36dba1e1ba48`

## Description

## Summary
- add an explicit line-height to the welcome page product title
- prevent wrapped titles from overlapping when the page is narrow

Fixes #297827.

Before:
<img width="278" height="144" alt="image" src="https://github.com/user-attachments/assets/d2402536-5324-4dae-b0e3-fdcab380640a" />

After:
<img width="283" height="151" alt="image" src="https://github.com/user-attachments/assets/de4f0a37-19e9-41d4-83d1-18176bf0a465" />

## Testing
- Not run (CSS-only change; no focused automated test covers this welcome page header)

## Commits

- Fix wrapped title spacing on agent sessions welcome page
- line-height: 1

## Changed Files

- src/vs/workbench/contrib/welcomeAgentSessions/browser/media/agentSessionsWelcome.css
