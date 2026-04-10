# Issue #304488: integration test failure: `chat - run_in_terminal`

**Repository:** microsoft/vscode
**Author:** @jrieken
**Created:** 2026-03-24T15:26:47Z
**Labels:** bug, important, regression

## Description


```
  1 failing
  1) chat - run_in_terminal
       shell integration on
         sandbox off
           multi-line output preserves all lines in order:

      AssertionError [ERR_ASSERTION] [ERR_ASSERTION]: Unexpected output: "M1_1774365615951"
      + expected - actual

      -false
      +true
      
      at Context.<anonymous> (D:\a\_work\1\s\extensions\vscode-api-tests\src\singlefolder-tests\chat.runInTerminal.test.ts:230:12)
```


https://dev.azure.com/monacotools/Monaco/_build/results?buildId=423550&view=logs&j=471dc74f-2452-533b-c058-e43cd1b98abf&t=4ac8d553-6ea9-54f9-26ce-940de10ed993

## Comments


### @isidorn (2026-03-30T07:29:36Z)

I still see the same when running integration tests locally

<img width="1297" height="525" alt="Image" src="https://github.com/user-attachments/assets/c7f82b28-cbcb-4275-84de-8c43321b02c3" />

Thus reopening. I know @dileepyavan is also looking into failing tests

---

### @alexr00 (2026-03-31T08:54:29Z)

This test is preventing a candidate from being merged. Disabling:
https://github.com/microsoft/vscode/pull/306668
https://github.com/microsoft/vscode/pull/306667

---

### @alexr00 (2026-04-01T09:57:54Z)

Some other failures here: https://monacotools.visualstudio.com/Monaco/_build/results?buildId=426548&view=logs&j=471dc74f-2452-533b-c058-e43cd1b98abf&s=27eddb93-7805-576c-c80f-37b2176e40f7&t=17481e7c-bad2-5920-e2d6-16c167afe4a6&l=1837

---

### @alexr00 (2026-04-01T10:48:23Z)

Disabled more here: https://github.com/microsoft/vscode/pull/307102

---
