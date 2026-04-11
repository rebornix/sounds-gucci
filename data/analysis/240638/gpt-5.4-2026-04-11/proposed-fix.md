# Bug Analysis: Issue #240638

## Understanding the Bug

The issue is limited to SVG preview zooming in the media preview extension. When the SVG does not declare an absolute `width` or `height` on the root `<svg>` element, the preview enters zoom mode but the SVG drawing itself does not scale. The user-visible symptom is that the preview background/checkerboard responds to zoom interactions while the foreground SVG content stays the same size.

The repro is especially strong for SVGs that only have a `viewBox` or use percentage sizing such as Mermaid CLI output (`width="100%"` and no explicit height). Those files zoom correctly in normal browsers, so the problem is in VS Code's preview implementation rather than in the SVG payload.

## Git History Analysis

I constrained history to the parent commit `71e3258bcce316b7d5fcba99ea8c6a5656cbb685` and started with the required incremental window.

- The 24-hour window ending at the parent commit only surfaced the parent merge itself, with no nearby ancestry changes in image preview code.
- Expanding to 72 hours still did not reveal any recent ancestry changes touching media preview zoom behavior.
- `git blame` on `extensions/media-preview/media/imagePreview.js` shows the relevant zoom implementation is much older: `updateScale(...)`, `firstZoom()`, and the image load handler all trace back to the original image preview logic from 2019, with no recent fixups in the parent ancestry.

This does not look like a fresh regression from a recent merge. It looks like a long-standing edge case in the original zoom implementation that only shows up for SVGs with no intrinsic pixel dimensions.

### Time Window Used

- Initial: 24 hours
- Final: 72 hours (expanded once)

## Root Cause

`extensions/media-preview/media/imagePreview.js` assumes that every preview image exposes meaningful intrinsic pixel dimensions through `image.naturalWidth` and `image.naturalHeight`, and that applying CSS `zoom` to the `<img>` element is enough to scale the rendered content.

That assumption breaks for SVGs whose root element does not provide absolute dimensions. In the pre-fix code:

- `firstZoom()` computes the first numeric zoom level as `image.clientWidth / image.naturalWidth`.
- `updateScale(...)` removes `scale-to-fit` and applies `image.style.zoom = scale`.
- The code never gives the `<img>` a concrete pixel `width`/`height` before switching into numeric zoom mode.

For SVGs that only have a `viewBox` or percentage sizing, the preview can render them in fit mode, but once VS Code switches to numeric zoom there is no stable intrinsic pixel box for `zoom` to scale from. The preview state changes, but the SVG drawing does not actually grow or shrink with it.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `extensions/media-preview/media/imagePreview.js`

**Changes Required:**

Keep the existing zoom model for normal images, but special-case images that do not expose intrinsic dimensions:

1. In `firstZoom()`, avoid deriving the initial numeric scale from `naturalWidth` when `naturalWidth` or `naturalHeight` is missing or zero.
2. In `updateScale(...)`, when entering numeric zoom for these dimensionless SVGs, capture the image's current rendered size and set explicit pixel `width` and `height` styles on the `<img>` before applying CSS `zoom`.
3. In the `'fit'` branch of `updateScale(...)`, clear any explicit `width` and `height` so fit-to-window behavior keeps working.

This makes the current on-screen size the `1x` baseline for SVGs without intrinsic dimensions, which is the smallest change that matches the existing zoom design.

**Code Sketch:**

```js
function firstZoom() {
        if (!image || !hasLoadedImage) {
                return;
        }

        if (!image.naturalWidth || !image.naturalHeight) {
                scale = 1;
        } else {
                scale = image.clientWidth / image.naturalWidth;
        }

        updateScale(scale);
}

function updateScale(newScale) {
        if (!image || !hasLoadedImage || !image.parentElement) {
                return;
        }

        if (newScale === 'fit') {
                scale = 'fit';
                image.classList.add('scale-to-fit');
                image.classList.remove('pixelated');
                image.style.zoom = 'normal';
                image.style.width = '';
                image.style.height = '';
                vscode.setState(undefined);
        } else {
                scale = clamp(newScale, MIN_SCALE, MAX_SCALE);

                if (scale >= PIXELATION_THRESHOLD) {
                        image.classList.add('pixelated');
                } else {
                        image.classList.remove('pixelated');
                }

                const dx = (window.scrollX + container.clientWidth / 2) / container.scrollWidth;
                const dy = (window.scrollY + container.clientHeight / 2) / container.scrollHeight;

                image.classList.remove('scale-to-fit');

                if (!image.naturalWidth || !image.naturalHeight) {
                        image.style.width = `${image.clientWidth}px`;
                        image.style.height = `${image.clientHeight}px`;
                }

                image.style.zoom = scale;

                const newScrollX = container.scrollWidth * dx - container.clientWidth / 2;
                const newScrollY = container.scrollHeight * dy - container.clientHeight / 2;
                window.scrollTo(newScrollX, newScrollY);
                vscode.setState({ scale: scale, offsetX: newScrollX, offsetY: newScrollY });
        }

        vscode.postMessage({
                type: 'zoom',
                value: scale
        });
}
```

### Option B: Comprehensive Fix (Optional)

Replace the image preview's numeric zoom implementation with a wrapper-based transform (`transform: scale(...)`) instead of CSS `zoom` on the `<img>` element. That would likely make SVG and raster behavior more uniform, but it is a broader change because the current scroll-centering logic, cursor behavior, and fit-mode transitions are all written around `zoom`.

For this issue, that is more risk than necessary.

## Confidence Level: Medium

## Reasoning

The key clues are all in the pre-fix script:

- The first transition out of fit mode depends on `naturalWidth`/`naturalHeight`.
- The numeric zoom path applies `zoom` but never pins the SVG to a concrete pixel size.
- The issue repro is specifically about SVGs lacking absolute dimensions, which is exactly the case where intrinsic pixel sizing is unreliable.

The proposed change is intentionally narrow. It preserves the existing code path for ordinary bitmap images and for SVGs that already have stable intrinsic dimensions, while giving dimensionless SVGs a concrete layout box before numeric zoom starts. That directly addresses the reported symptom without forcing a redesign of the preview's zoom system.