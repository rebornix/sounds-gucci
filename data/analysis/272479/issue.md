# Issue #272479: The typescript source.addMissingImports code action always using type keyword and doesn't respect the settings: preferTypeOnlyAutoImport

**Repository:** microsoft/vscode
**Author:** @hansyulian
**Created:** 2025-10-21T13:48:01Z
**Labels:** bug, help wanted, typescript, insiders-released

## Description

<!-- ⚠️⚠️ Do Not Delete This! bug_report_template ⚠️⚠️ -->
<!-- Please read our Rules of Conduct: https://opensource.microsoft.com/codeofconduct/ -->
<!-- 🕮 Read our guide about submitting issues: https://github.com/microsoft/vscode/wiki/Submitting-Bugs-and-Suggestions -->
<!-- 🔎 Search existing issues to avoid creating duplicates. -->
<!-- 🧪 Test using the latest Insiders build to see if your issue has already been fixed: https://code.visualstudio.com/insiders/ -->
<!-- 💡 Instead of creating your report here, use 'Report Issue' from the 'Help' menu in VS Code to pre-fill useful information. -->
<!-- 🔧 Launch with `code --disable-extensions` to check. -->
Does this issue occur when all extensions are disabled?: Yes

<!-- 🪓 If you answered No above, use 'Help: Start Extension Bisect' from Command Palette to try to identify the cause. -->
<!-- 📣 Issues caused by an extension need to be reported directly to the extension publisher. The 'Help > Report Issue' dialog can assist with this. -->
- VS Code Version: 1.105.1
- OS Version: Windows 11 25H2

Steps to Reproduce:
1. Just make one of the import gone
2. Then use the command to auto import
3. It always import with type no matter what and doesn't respect the setting

## Comments


### @mjbvz (2025-10-21T14:59:57Z)

> command to auto import

What command are you using? Is it the normal quick fix? /gifPlease

---

### @vs-code-engineering (2025-10-21T15:00:33Z)

Thanks for reporting this issue! Unfortunately, it's hard for us to understand what issue you're seeing. Please help us out by providing a screen recording showing exactly what isn't working as expected. While we can work with most standard formats, `.gif` files are preferred as they are displayed inline on GitHub. You may find https://gifcap.dev helpful as a browser-based gif recording tool.

If the issue depends on keyboard input, you can help us by enabling screencast mode for the recording (`Developer: Toggle Screencast Mode` in the command palette). Lastly, please attach this file via the GitHub web interface as emailed responses will strip files out from the issue.

Happy coding!

---

### @hansyulian (2025-10-21T15:12:30Z)

hi @mjbvz it's this one

![Image](https://github.com/user-attachments/assets/230062c2-c713-4224-bfc5-7b16d4e2c3c8)

---

### @mjbvz (2025-10-21T15:13:50Z)

Thanks, what do you have `preferTypeOnlyAutoImport ` set to?

---

### @hansyulian (2025-10-21T15:15:30Z)

it's like this

<img width="705" height="83" alt="Image" src="https://github.com/user-attachments/assets/b61cee32-1425-43b0-9e93-754ca3766312" />

---

### @hansyulian (2025-10-21T15:16:30Z)

i even put it in my settings.json:

`"typescript.preferences.preferTypeOnlyAutoImports": false,`

---

### @mjbvz (2025-10-21T15:19:12Z)

Does it work if you use the quick fix light bulb instead of that custom keybinding? 

Does this reproduce with all [extensions disabled](https://github.com/microsoft/vscode/wiki/Performance-Issues#run-with-extensions-disabled)? Make sure to restart VS Code after disabling them too

---

### @hansyulian (2025-10-21T15:21:15Z)

Does it work if you use the quick fix light bulb instead of that custom keybinding? `yes it works correctly using light bulb `

Does this reproduce with all [extensions disabled](https://github.com/microsoft/vscode/wiki/Performance-Issues#run-with-extensions-disabled)? Make sure to restart VS Code after disabling them too `it still behaves the same, it still use 'type'`

---

### @mjbvz (2025-10-21T15:28:22Z)

Thanks. Updated title to make issue more clear

---
