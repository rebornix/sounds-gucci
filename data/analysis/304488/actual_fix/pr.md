# PR #304513: Fix PowerShell chained output in run_in_terminal

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `12998a85a1939848f7ee07b2cac93d443233c0ce`
**Parent Commit:** `34361c9626509fbd8dea833f0128bb4f35e76857`

## Description

fix #304488

Fixes a regression where `run_in_terminal` could return only the first line for chained PowerShell commands (for example `echo a ; echo b ; echo c`). 

- Keeps bracketed paste enabled by default for `isMacintosh`

## Commits

- fix #304488
- restrict to mac
- use isMac
- Merge branch 'main' into merogge/fix-run-term
- Merge branch 'main' into merogge/fix-run-term
- Merge branch 'main' into merogge/fix-run-term

## Changed Files

- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/basicExecuteStrategy.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/noneExecuteStrategy.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/richExecuteStrategy.ts
