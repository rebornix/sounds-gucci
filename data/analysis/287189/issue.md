# Issue #284539: [Unhandled Error] Cannot read properties of undefined (reading 'getViewLineMinColumn')

**Repository:** microsoft/vscode
**Author:** @bryanchen-d
**Created:** 2025-12-19T22:50:16Z
**Labels:** bug, verified, error-telemetry, insiders-released

## Description

Issue created from VS Code Errors Analysis Dashboard

## Error Bucket
`a4930d15-126a-0fda-da7e-400d10c6a1cd`

## Error Message
```
Cannot read properties of undefined (reading 'getViewLineMinColumn')
```

## Stack Trace
>TypeError: Cannot read properties of undefined (reading 'getViewLineMinColumn')
at Yts.getViewLineMinColumn ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/common/viewModel/viewModelLines.ts:739:61](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/common/viewModel/viewModelLines.ts#L739:61))
at iis.getLineMinColumn ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/common/viewModel/viewModelImpl.ts:769:21](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/common/viewModel/viewModelImpl.ts#L769:21))
at A5i.update ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/common/viewModel/viewModelImpl.ts:1289:125](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/common/viewModel/viewModelImpl.ts#L1289:125))
at iis.setViewport ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/common/viewModel/viewModelImpl.ts:745:22](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/common/viewModel/viewModelImpl.ts#L745:22))
at Object.renderText ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/view.ts:580:28](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/browser/view.ts#L580:28))
at Object.renderText ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/view.ts:520:22](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/browser/view.ts#L520:22))
at <anonymous> ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/view.ts:857:46](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/browser/view.ts#L857:46))
at func ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/view.ts:790:9](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/browser/view.ts#L790:9))
at safeInvokeNoArg ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/view.ts:857:14](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/browser/view.ts#L857:14))
at $2e.t [as g] ([file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/view.ts:840:9](https://vscode.dev/github/microsoft/vscode/blob/994fd12f8d3a5aa16f17d42c041e5809167e845a/src/vs/editor/browser/view.ts#L840:9))


## Details
| Property | Value |
| --- | --- |
| Version | 1.107.1 |
| Commit | [994fd12f](https://github.com/microsoft/vscode/commit/994fd12f8d3a5aa16f17d42c041e5809167e845a) |
| Last Seen | 2025-12-18T23:59:48.224Z |
| Total Hits | 2.2M |
| Affected Users | 52.1K |
| Platforms | Linux, Mac, Windows |
| Product | VSCode |

---
*This issue was automatically created from the VS Code Errors Dashboard*

## Comments

