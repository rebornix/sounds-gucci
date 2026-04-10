# PR #304973: fix: enable zoom for SVGs without explicit width/height dimensions

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `d5370dfd468f3d10216e5fb2fb5c8696fca6254f`
**Parent Commit:** `71e3258bcce316b7d5fcba99ea8c6a5656cbb685`

## Description

## What kind of change does this PR introduce?

Bug fix

## What is the current behavior?

SVG images that rely solely on a `viewBox` attribute (without explicit `width`/`height` attributes) cannot be zoomed in the image preview. When attempting to zoom, only the checkerboard background scales but the SVG content stays the same size, effectively ignoring zoom.

This happens because:
1. `image.naturalWidth` is 0 for SVGs without intrinsic dimensions, causing `firstZoom()` to compute `Infinity` as the scale (division by zero)
2. CSS `zoom` has no effect on the SVG content because the SVG renders at 100% of whatever container size it is given -- when zoom changes the container, the SVG just re-renders to fill the new size

Closes #240638

## What is the new behavior?

- When `naturalWidth`/`naturalHeight` are 0 (no intrinsic dimensions), explicit `minWidth`/`minHeight` are set on the image element to lock in concrete pixel dimensions before applying CSS zoom, so the SVG content scales proportionally
- `firstZoom()` defaults to scale 1x when `naturalWidth` is 0, instead of computing `Infinity`
- Explicit dimensions are cleared when returning to "scale-to-fit" mode so the image can flow naturally again

## Additional context

Tested with SVGs that have:
- Only `viewBox` (no width/height) -- e.g. `<svg viewBox="0 0 100 100" xmlns="...">`
- `width="100%"` (no height) -- e.g. mermaid CLI output
- Normal raster images are unaffected since they always have valid `naturalWidth`/`naturalHeight`

## Commits

- fix: enable zoom for SVGs without explicit width/height dimensions
- Merge branch 'main' into fix/svg-zoom-no-dimensions-v2

## Changed Files

- extensions/media-preview/media/imagePreview.js
