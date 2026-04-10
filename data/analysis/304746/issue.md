# Issue #304746: Chat pickers no longer work in floating windows

**Repository:** microsoft/vscode
**Author:** @BastiCL
**Created:** 2026-03-25T13:06:41Z
**Labels:** bug, important, verified, insiders-released, workbench-auxwindow, chat

## Description


- Copilot Chat Extension Version: 0.41.1
- VS Code Version: 1.113.0
- OS Version: Mac OS X 15.7.4
- Feature (e.g. agent/edit/ask mode): Agent
- Selected model (e.g. GPT 4.1, Claude 3.7 Sonnet): Auto

Steps to Reproduce:

1. Open a new copilot chat window (in my case was fullscreen mode)
2. Try to click one of the bottom dropdown selectors (eg. copilot mode or model)

## Comments


### @BastiCL (2026-03-25T14:06:01Z)

The issue happens also in windowed mode and the dropdown selectors don't work.

---

### @roblourens (2026-03-25T16:45:11Z)

Yes, when not fullscreened then the dropdowns simply don't work. 

What the heck

https://github.com/user-attachments/assets/755c74e6-6bcd-4882-b8bb-84d5541992be

---

### @roblourens (2026-03-25T17:00:36Z)

@sandy081 this is something from https://github.com/microsoft/vscode/pull/302976

---

### @bpasero (2026-03-26T07:45:32Z)

@sandy081 this seems to originate from the following code:

https://github.com/microsoft/vscode/blob/f6218ecb334fe88a019dfc08bfbf234376520c83/src/vs/platform/actionWidget/browser/actionList.ts#L749-L772

Where this is maybe called too early before the element is connected to the DOM and thus when calling focus, we do not know that the element is in the floating window, thus causing the main window to briefly come to front.

Can you clarify what this code does and why its needed? The suggested fix from AI is to wrap that code with a `if (this.domNode.isConnected) {` to prevent calling it when the node is not in the DOM yet, but I am not feeling confident its solving the reason why this code exists in the first place.

---

### @sandy081 (2026-03-27T07:43:07Z)

Yah - this is the regression from sub menu changes. Will fix it. 

---

### @sandy081 (2026-03-27T12:24:51Z)

The `_applyFiter` method rebuilds the visible item list whenever filtering, section collapsing, or item removal happens. After the splice, it restores DOM focus and the previously focused item to prevent the widget from closing — the `ActionWidgetService` uses a focus tracker on the widget's container element, and if focus leaves the container, it calls this.hide(true).

There are two issues here:


**1. Missing `_hasLaidOut` guard**

Before bf56017b, `_applyFilter`had a `this._hasLaidOut` guard around the focus restoration block — it was only set to true after the first `layout()` call. This meant the `list.domFocus()` + focus restoration code never ran during construction (when `_applyFilter()` is called to do the initial splice).

The refactor extracted `ActionListWidget` from `ActionList` and in doing so dropped this guard. Now `domFocus()` runs during construction, before the element is connected to the DOM. As you identified, calling `.focus()`on a node created from the main window's document before it's attached to the auxiliary window causes the main window to briefly come to front.

The fix restores previous `_hasLaidOut` behaviour and skips focus management during construction — matching the pre-refactor behavior.

**2. `list.domFocus()` is unnecessary**

Even after the `_hasLaidOut` guard, the `this._list.domFocus()` call is not needed. The List widget's scrollable container (which holds `tabindex` and DOM focus) is never destroyed by `splice` — only child row elements are recycled. DOM focus stays on the list container throughout, no blur fires on the widget element, and `domFocus()` is effectively a no-op. The focus restoration that actually matters is the `setFocus([i])` / `reveal(i)` calls below it, which set the *list-level* focus (highlighted item), not DOM focus.

So the fix also removes the `domFocus()` call, keeping only the item-level focus restoration.

---
