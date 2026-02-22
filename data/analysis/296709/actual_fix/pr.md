# PR #296709: Fix ViewModel issue where all lines were hidden

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `9c99e8fb20933a838deb6a62a0a9e2ab1919290f`
**Parent Commit:** `beb0fcb0c5f07a15ca107ff36ab5df856d9f9051`

## Description

Fixes https://github.com/microsoft/vscode/issues/293365

- Always ensure at least one line is visible in the ViewModel
- Revert https://github.com/microsoft/vscode/pull/287189
- Improve `ConstantTimePrefixSumComputer` to better handle the case where all values are zeroes.
- Avoid that a throwing view model would prevent event delivery for other view models

## Commits

- Fix `ConstantTimePrefixSumComputer` when the values are all zeroes
- Merge remote-tracking branch 'origin/main' into alexd/comparable-sparrow
- Update src/vs/editor/test/common/viewModel/prefixSumComputer.test.ts
- Update src/vs/editor/common/model/prefixSumComputer.ts
- fix: ensure at least one line remains visible after edits with hidden…
- Revert setViewport early return (aee9b1b3) since the root cause (0 vi…
- Add unit test for overlapping hidden ranges
- fix: safety check in _constructLines for 0 visible lines
- Protect event delivery
- Update src/vs/editor/test/common/viewModel/prefixSumComputer.test.ts
- Fix unit test

## Changed Files

- src/vs/editor/common/model/prefixSumComputer.ts
- src/vs/editor/common/model/textModel.ts
- src/vs/editor/common/viewModel/viewModelImpl.ts
- src/vs/editor/common/viewModel/viewModelLines.ts
- src/vs/editor/test/browser/viewModel/viewModelImpl.test.ts
- src/vs/editor/test/common/viewModel/prefixSumComputer.test.ts
