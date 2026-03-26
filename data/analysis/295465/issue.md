# File icons missing in Windows file explorer due to version-specific hash in file icon directory path

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
- VS Code Version: 1.109.3
- OS Version: Windows_NT x64 10.0.26200

<img width="691" height="114" alt="Image" src="https://github.com/user-attachments/assets/ea702da3-b079-4da0-958e-1f1ad9738a0c" />

I noticed that after the 1.109.0 update, all file icons associated with VSCode in Windows file explorer have disappeared. It seems that starting from version 1.109.0, VSCode changed its installation directory structure, causing the path to the icon directory to contain a hash that differs with each version like `C:\Program Files\Microsoft VS Code\<hash>\resources\app\resources\win32`.

I can manually modify the icon paths for these file types using tools like Default Programs Editor, but it's impractical to do this manually after every update. Is there a way to set these icons with a single click?