# PR #292258: fix: wrap long docstrings in parameter hints widget

## Summary
Fixes long docstrings in the parameter hints widget not wrapping. Previously, long strings were displayed on a single line with only a vertical scroll bar, making it impossible to read long descriptions.

### Changes
- Add `overflow-wrap: break-word` and `word-break: break-word` to `.docs` so long strings wrap within the widget width
- Add `min-width: 0` to `.docs` for proper flexbox sizing (allows the element to shrink below content size)
- Add `overflow-wrap`, `word-break`, and `max-width: 100%` to `.markdown-docs` for rendered markdown content

### Before
Long docstrings displayed on a single line, requiring horizontal scroll (but no horizontal scrollbar was shown).

### After
Long docstrings wrap within the parameter hints widget (max-width: 440px), making them readable without horizontal scrolling.

Fixes #142888

Made with [Cursor](https://cursor.com)