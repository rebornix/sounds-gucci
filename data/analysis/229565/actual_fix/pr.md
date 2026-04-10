# PR #304958: fix: use conic-gradient for image preview transparency checkerboard

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `93ca9c09293de70c5705c93ee5ddd92a538aa4cb`
**Parent Commit:** `d7c19c5af6e6a30a429780ef12c8146468e9cf6c`

## Description

## What kind of change does this PR introduce?

Bug fix

## What is the current behavior?

The transparency checkerboard pattern in the image preview shows triangular artifacts at certain zoom levels. This happens because the pattern uses two overlapping `linear-gradient(45deg, ...)` backgrounds with offset positions, and subpixel rendering at non-integer zoom factors causes the diagonal gradient edges to misalign, creating visible triangles instead of clean squares.

Closes #229565

## What is the new behavior?

Replaced the two `linear-gradient(45deg, ...)` backgrounds with a single `conic-gradient(...)` per theme. The conic gradient creates a clean four-square checkerboard tile using 90-degree segments (25% each), which eliminates diagonal edges entirely. This renders correctly at all zoom levels without subpixel artifacts.

The `background-position` offset is also removed since a single conic-gradient tile already produces the full checkerboard pattern without needing two overlapping layers.

## Additional context

The `conic-gradient` approach is the standard modern CSS technique for checkerboard patterns. It is supported in all Chromium-based browsers (which VS Code uses via Electron).

**Before (at certain zoom levels):**
Triangular artifacts visible at tile boundaries

**After:**
Clean square checkerboard at all zoom levels

## Commits

- fix: use conic-gradient for image preview transparency checkerboard

## Changed Files

- extensions/media-preview/media/imagePreview.css
