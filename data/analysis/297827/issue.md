# Issue #297827: Copilot Welcome Page: Title line height is too small

**Repository:** microsoft/vscode
**Author:** @jruales
**Created:** 2026-02-25T23:40:01Z
**Labels:** bug, verified, good first issue, insiders-released

## Description

Title line height is too small, so the text overlaps with itself when it wraps

<img width="321" height="739" alt="Image" src="https://github.com/user-attachments/assets/d771e65f-4cb5-4edf-88a2-60827b153dab" />

## Comments


### @omwanere (2026-03-24T16:43:24Z)

The issue appears to be caused by insufficient line-height on the title when it wraps.

Proposed fix:
Use a relative line-height (e.g., 1.2–1.4) instead of a fixed or default value.

Example:
.title {
  line-height: 1.3;
}

This ensures proper spacing across different screen sizes and zoom levels.

---

### @PrathamPeriwal (2026-03-25T14:29:22Z)

Hi @jruales @benibenj @bpasero ! I think I might know the fix for this issue and would like to work on it. Could you please assign it to me?

---

### @vs-code-engineering (2026-03-25T18:46:38Z)

Sharing media from merged PR #304686 for verification:

<img width="278" height="144" alt="image" src="https://github.com/user-attachments/assets/d2402536-5324-4dae-b0e3-fdcab380640a" />

<img width="283" height="151" alt="image" src="https://github.com/user-attachments/assets/de4f0a37-19e9-41d4-83d1-18176bf0a465" />

Source PR: https://github.com/microsoft/vscode/pull/304686

---

### @jo-oikawa (2026-03-30T21:22:47Z)

Verified! Looks much better.

---
