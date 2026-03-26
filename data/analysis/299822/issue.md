# Space character typed in Textual does not appear in VS Code integrated terminal

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
- VS Code Version: 1.110
- OS Version: macOS 26.3 

Steps to Reproduce:

_Originally reported in the Textual repo: https://github.com/Textualize/textual/issues/6408_

- Using Textual 8.0.2, Python 3.12
- Given the following Python code:
```py
from textual.app import App
from textual.widgets import Input


class TestApp(App):
    def compose(self):
        yield Input(placeholder="Type here...")

if __name__ == "__main__":
    app = TestApp()
    app.run()
```

When I press the spacebar the space character does not get displayed when running inside the VS Code integrated terminal:

https://github.com/user-attachments/assets/ad4c8c24-5b4d-4104-8ebd-b7530625281f


It works if I disable the `terminal.integrated.enableKittyKeyboardProtocol` setting in VS Code. This started happening in VS Code version 1.110.

From https://github.com/Textualize/textual/issues/6408#issuecomment-4013027855:

> Based on this sentence from the [Disambiguate escape codes](https://sw.kovidgoyal.net/kitty/keyboard-protocol/#disambiguate-escape-codes) section:
> 
> > With this flag turned on, all key events **that do not generate text** are represented in one of the following two forms [emphasis mine]
> 
> My understanding is that space should not be reported with `CSI u` encoding.