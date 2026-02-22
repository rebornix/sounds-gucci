# Error Telemetry Bug-Fix PRs

Repository: microsoft/vscode
Date range: 2025-12-01 to 2026-02-22
Label: error-telemetry

| PR # | PR Title | Issue # | Issue Title | Merge Commit | Parent Commit |
|------|----------|---------|-------------|--------------|---------------|
| 296709 | Fix ViewModel issue where all lines were hidden | 293365 | [Unhandled Error] Cannot read properties of undefined (reading 'getViewLineMinCo | 9c99e8f | beb0fcb |
| 294001 | Fix URI scheme error in LoggerChannelClient.deregisterLogger | 293503 | [Unhandled Error] [UriError]: Scheme contains illegal characters. | 0c3d14a | a5c4130 |
| 287189 | fix undefined property error from getViewLineMinColumn | 284539 | [Unhandled Error] Cannot read properties of undefined (reading 'getViewLineMinCo | aee9b1b | 3df70f3 |
| 286573 | Fix error in rasterizeGlyph | 246658 | Uncaught TypeError: Cannot read properties of undefined (reading 'substring') | e785475 | 7939bad |
| 286173 | Fix race condition in terminal suggest widget initialization causing appendChild crash | 283291 | Cannot read properties of undefined (reading 'appendChild') | a967622 | 08070ad |
| 285970 | Fix querySelector TypeError in terminal suggest when xterm element becomes undefined | 285923 | Cannot read properties of undefined (reading 'querySelector') | de56ab1 | 8fdef91 |
| 285610 | Do not assume stdio fields to be defined when spawning a child process. | 145504 | Cannot read property 'end' of undefined | 3cb01d9 | b87990a |
| 285608 | Handle more cases in scmViewPane.getParent | 204995 | Unexpected call to getParent | 1eee6eb | c1dd529 |
| 284078 | Fix error in releasenotes editor | 283296 | this.O is not a function | 39cf282 | a679af0 |
| 283958 | Fix TypeError when accessing undefined character in terminal suggest trigger detection | 283295 | Cannot read properties of undefined (reading 'match') | 88b7540 | 8202cbb |
| 283868 | wait for xterm element vs assuming it's defined | 283287 | Cannot read properties of undefined (reading 'querySelector') | f4367f5 | 5fd2594 |
| 283844 | Remove non null assertion | 283302 | Cannot read properties of undefined (reading 'setAttribute') | 934a4f6 | 9b01c97 |
| 283630 | fix: error in epoch bounds in edit timeline | 283304 | Cannot read properties of undefined (reading 'requestId') | 059761d | a8f7190 |
| 282221 | Fix race condition causing "Model is disposed!" error in virtual document updates | 212713 | Model is disposed! | 5639dca | 5a6cdd0 |
| 280217 | Fix illegal characters in Dynamic Auth Provider logger filename | 269810 | `loggerIpc#deregisterLogger` fails with Scheme contains illegal characters | 2d96f38 | 9401832 |
| 255490 | add layover to new cells correctly and dispose of listeners as cells are removed | 251601 | ListError [NotebookCellList] Invalid index 50 | ce37a38 | d9d3f3c |
