# PR #304163: fix get task output for watch tasks

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `1e5df648f58f749457087694efdbba1f84bd2b94`
**Parent Commit:** `64d4465e27ced28556429d06f1ea6eb4a94e94e8`

## Description

fix #304057

`get_task_output` could return empty output even when the task terminal had content because output collection could start from a fresh marker created at read time, which for completed/background tasks can point to the end of the buffer.

Now, in `getTaskOutputTool`, pass a start-marker map only for background tasks. For those background/watch tasks, set each terminal entry to undefined so collection reads the current terminal buffer instead of from a newly created marker.

Keep existing behavior for single-run tasks, so reused-terminal protection remains and old buffer content is not pulled in.

## Commits

- fix get task output for watch tasks

## Changed Files

- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/task/getTaskOutputTool.ts
