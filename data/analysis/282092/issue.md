# Issue #281924: Chat agent: cloud session does not show changes

**Created**: 2025-12-08T11:07:52Z  
**Closed**: 2025-12-18T06:15:43Z  
**Author**: bpasero (Microsoft Member)  
**Assignee**: osortega  
**Labels**: bug, verified, chat-agent, chat-cloud-agent  
**Milestone**: December 2025

## Description

I have a cloud session with changes (in https://github.com/microsoft/vscode/pull/281912) but all I see is the PR as description, no changes button:

![Image showing session card without changes button](https://github.com/user-attachments/assets/f7b8acd0-3183-4c98-93f0-2de20c211bba)

---

## Expected Behavior

Cloud sessions with file changes should display a "changes" button showing diff statistics (e.g., "+X/-Y, N files") similar to local sessions.

## Actual Behavior

Cloud sessions only show the PR description text, but no changes button is visible even when the session has file changes.
