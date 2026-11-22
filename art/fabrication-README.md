# La Maison en fabrication

The installation is built from the same Three.js meshes for the interactive scene and the photographic sequence. Its printed panels become a pavilion, the camera approaches that pavilion, the light changes, and the installation separates into eight editions before becoming printed and digital formats again.

## Source of truth

- `components/fabrication/scene-geometry.ts` constructs all 46 objects and interpolates seven physical poses. No model or photography is fetched from a third-party service.
- `art/fabrication-textures.mjs` creates the four printed surfaces. Their SVG sources are retained in this directory.
- `art/fabrication-export.mjs` exports those exact buffer geometries, UVs, material assignments, object matrices and camera matrices. Intermediate JSON goes to `/tmp/maison-fabrication`, outside the repository.
- `art/fabrication-render.py` reconstructs the export in Blender and renders with Cycles on CPU. It preserves transparency, including contact shadows, so the page's paper and night backgrounds remain continuous.

## Rebuild

Run from the repository root:

```sh
node art/fabrication-textures.mjs
node --experimental-strip-types art/fabrication-export.mjs
blender -b -t 8 --python art/fabrication-render.py -- --webp-output public/fabrication --samples 32
```

Blender 4.3, FFmpeg with `libwebp`, Node 22, the repository's Three.js, and Sharp are used. Denoising does not require OpenImageDenoise or a GPU. The RGBA denoising pass treats the shadow alpha separately and preserves the printed surfaces. Images are replaced atomically so a preview never receives a half-written file.

The renderer prioritizes the seven principal poses and four control variants, then renders the remaining frames. A partial preview can be produced with `--frames 0,8,16,24,32,40,48 --scale 75 --samples 20`. `--skip-existing` resumes an interrupted full render without replacing completed files.

## Runtime

`FabricationScene` receives the mutable `FabricationScore` shared with the editorial GSAP timeline. It checks WebGL 2 availability before constructing a renderer. When WebGL is unavailable, a local, interpolated sequence is used. The first poster is shown while the scene initializes.

The photographic mode contains 49 timeline frames and eleven separately rendered states for the visitor's controls:

- `variant-format-0.webp` / `variant-format-1.webp`: portrait and panoramic panel proportions;
- `variant-exploded.webp`, plus `variant-exploded-1.webp` through `variant-exploded-7.webp`: roof blades and wall assemblies separated in space, with nine interpolated positions including the assembled timeline pose;
- `variant-light.webp`: a stronger warm lighting arrangement.

These variants are interpolated only near their associated chapter. The assembly camera moves back as the roof rises, keeping the separated parts in view. They preserve the actual alternate geometry and lighting; they are not brightness or scale filters applied to a single image. The pointer movement in this mode is a small parallax translation. In WebGL, the same movement slightly rotates the installation and changes its perspective.

Three.js and its environment are loaded only after a successful WebGL preflight. Rendering pauses outside the viewport and in a hidden tab. Download concurrency is three images. The entire decoded image cache, including control variants, is limited to 22 images on desktop or 14 on mobile. Variants are released when their chapter is left, and only assembly positions close to the current slider value are retained. Pointer movement is disabled when reduced motion is requested. The page itself handles chapter-based reduced-motion navigation.

Diagnostic data is placed on the scene and canvas: `data-renderer`, `data-ready`, `data-progress`, and, for the sequence, `data-frame`, `data-variant`, `data-loaded-frames`. These attributes do not add any technical copy to the visitor's experience.
