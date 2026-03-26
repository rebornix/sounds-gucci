# PR #300563: hide "Ask for Edits" affordance when AI features are disabled

Fixes #300500

### Explanation
Check `ChatEntitlementContextKeys.Setup.hidden` before showing the "Ask for Edits" affordance when text is highlighted.  
If AI features are disabled, the affordance is not displayed.

### Testing
1. Build and run VS Code.
2. Enable **Disable AI Features** in Settings.
3. Highlight text in the editor.

### Expected result: 
the **"Ask for Edits"** affordance does not appear.