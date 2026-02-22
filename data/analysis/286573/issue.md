# Issue #246658: Uncaught TypeError: Cannot read properties of undefined (reading 'substring')

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-04-15T18:20:01Z
**Labels:** bug, verified, error-telemetry, insiders-released, editor-gpu

## Description

```javascript
TypeError: Cannot read properties of undefined (reading 'substring')
at gz._rasterizeGlyph in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/raster/glyphRasterizer.ts:169:28
at gz.rasterizeGlyph in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/raster/glyphRasterizer.ts:97:15
at cS.r in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/atlas/textureAtlasPage.ts:81:38
at cS.getGlyph in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/atlas/textureAtlasPage.ts:71:102
at SR.u in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/atlas/textureAtlas.ts:136:27
at SR.getGlyph in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/atlas/textureAtlas.ts:130:15
at Array.<anonymous> in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/atlas/textureAtlas.ts:178:12
at c4i.j in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/editor/browser/gpu/taskQueue.ts:89:27
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=4949701c880d4bdb949e3c0e6b400288da7f474b&bH=394affaf-499b-6100-8f1b-bdb6b4e4f04e)

## Comments


### @Tyriar (2026-01-08T16:24:57Z)

Repro from this:

1. Open Code OSS, enable gpu
2. Open terminalInstance.ts
3. Open runInTerminalTool.ts, switch between them (happens every time)

<img width="1142" height="315" alt="Image" src="https://github.com/user-attachments/assets/82c99c6e-a7f8-49f5-b81b-17bd9fa21353" />

---

### @Tyriar (2026-01-08T16:32:07Z)

```
Uncaught TypeError: Cannot read properties of undefined (reading 'substring')
    at GlyphRasterizer._rasterizeGlyph (glyphRasterizer.ts:198:28)
    at GlyphRasterizer.rasterizeGlyph (glyphRasterizer.ts:98:15)
    at TextureAtlasPage._createGlyph (textureAtlasPage.ts:81:38)
    at TextureAtlasPage.getGlyph (textureAtlasPage.ts:71:102)
    at TextureAtlas._tryGetGlyph (textureAtlas.ts:138:27)
    at TextureAtlas.getGlyph (textureAtlas.ts:132:15)
    at Array.<anonymous> (textureAtlas.ts:180:12)
    at IdleTaskQueueInternal._process (taskQueue.ts:93:29)
```

---
