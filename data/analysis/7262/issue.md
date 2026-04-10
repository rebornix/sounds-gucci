# Issue #7262: Function breakpoints should have glyphs

**Repository:** microsoft/vscode
**Author:** @edumunoz
**Created:** 2016-06-06T19:38:17Z
**Labels:** debug

## Description

Currently, VSCode doesn't show any kind of graphical feedback of where function breakpoints have bound to.

Visual Studio and other IDEs show some graphical feedback to show the function breakpoint has bound to some specific locations / the debugger is in break mode at a particular line because of a function breakpoint.
It would be great for VSCode to support this in the case when debug adapters report the line(s) where the function breakpoint has been bound.

This helps users determine that
- there is a breakpoint that will be hit at some locations
- a breakpoint has been hit when stopped at a function breakpoint.

@weinand @isidorn

## Comments


### @isidorn (2016-10-06T15:06:21Z)

This sounds interesting to me. Especially since it would also solve our issue on how to add condition or hit counts to function breakpoints

---

### @isidorn (2017-11-17T15:23:30Z)

Somewhat a duplicate of https://github.com/Microsoft/vscode/issues/3388

---

### @isidorn (2018-02-14T10:36:11Z)

In february we will tackle https://github.com/Microsoft/vscode/issues/3388 and as part of that we will show function breakpoint glyphs in the debug viewlet.

Showing function breakpoint glyphs in the editor margin is not possible since this is not supported by the debug adapter protocol, and I am not sure which debuggers could support this funcionality. 

Since the first part of this issue is covered by another issue and the second part we do not plan to work on I have decided to close this issue.

---
