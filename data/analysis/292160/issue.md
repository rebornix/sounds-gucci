# Issue #291444: Open recent is not actionable with no recent workspaces

**Repository:** microsoft/vscode
**Author:** @cwebster-99
**Created:** 2026-01-28T23:36:24Z
**Labels:** insiders-released

## Description

Opening VS Code for the first time I dont have any recent workspaces so the dropdown is empty. If there are no recents should this say open folder? 

https://github.com/user-attachments/assets/5c6813f2-3c7f-42b8-a950-a72ffbc85308

## Comments


### @osortega (2026-01-29T16:50:00Z)

@cwebster-99 in this case it should open the dropdown with the option of open folder, is this about not hiding the open folder option in the dropdown and make it the primary action or is the issue that you are not seeing the dropdown work?

---

### @cwebster-99 (2026-01-29T17:23:44Z)

Would we know on load that the user doesn't have any recents? If so, we should show Open Folder as the top level action to make the on ramp easier. 


I noticed that even with recents there is no open folder option in the dropdown. Should that be added? 

---
