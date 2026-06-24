# Game Texture Lab

Game Texture Lab is a static browser tool for generating procedural game textures with HTML Canvas 2D. It is designed to run directly on itch.io as an HTML/browser project.

## Status

- Runtime: static HTML/CSS/JavaScript.
- Frameworks: none.
- Server: none.
- License: MIT.
- Default language: English, with Chinese available from the language selector.

## Repository Layout

```text
index.html
LICENSE
README.md
src/
  app.bundle.js
  core/
  generators/
  noise/
  styles/
  utils/
tools/
  build-bundle.mjs
```

## itch.io Upload
https://jz2010927.itch.io/noise-texture-generator

1. Zip the contents of this folder, not the parent folder.
2. Make sure `index.html` is at the root of the ZIP.
3. In itch.io, create or edit a project.
4. Set `Kind of project` to `HTML`.
5. Upload the ZIP.
6. Enable `This file will be played in the browser`.
7. Recommended viewport: `1280 x 800` or larger. Fullscreen is recommended.

The app has no server, database, npm install, or build step at runtime. It loads `src/app.bundle.js` from `index.html`.

From PowerShell, a release ZIP can be created from the project root with:

```powershell
$zip = "..\game-texture-lab-itch.zip"
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path index.html,README.md,LICENSE,src,tools -DestinationPath $zip -CompressionLevel Optimal
```

## Features

- English by default, with a Chinese language switch in the bottom toolbar.
- Three-panel workspace: texture categories, canvas preview, dynamic parameters.
- Manual generation: parameter changes mark the texture as pending; generation starts only after `Generate / Refresh`.
- Worker rendering when the browser supports Worker + OffscreenCanvas.
- Preview zoom and pan.
- PNG/WebP export with custom width and height up to 8192.
- Derived map export: Color, Height Map, Normal Map, Roughness, Alpha Mask, Emissive Map.
- Texture pack export as a single ZIP file.
- Tileable mode for supported material and environment textures.
- Built-in presets for key generators.

## Local Run

Open `index.html` directly in a browser, or run a local static server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Development

Edit files under `src/`, then rebuild the direct-browser bundle:

```bash
node tools/build-bundle.mjs
```

`index.html` intentionally uses the bundle instead of ES modules so it can run from `file://` and in itch.io's browser frame.

Commit both the source files and the rebuilt `src/app.bundle.js` when changing runtime code. The bundle is intentionally tracked because itch.io and direct `file://` usage should work without a build step.

## Adding Generators

1. Add or update a generator under `src/generators/`.
2. Keep the standard interface:

```js
export const MyGenerator = {
  id: "my-generator",
  name: "My Generator",
  description: "Short description",
  getDefaultParams() {
    return { Seed: "my-seed", Scale: 4 };
  },
  getParamSchema() {
    return [{ key: "Scale", label: "Scale", type: "range", min: 1, max: 10, step: 0.1 }];
  },
  generate(canvas, params, context) {
    const ctx = canvas.getContext("2d");
    // Draw texture pixels.
  },
};
```

3. Register it in `src/generators/index.js`.
4. Add metadata, presets, tileable support, and supported map types in `src/generators/GeneratorMetadata.js`.
5. Add it to the category tree in `src/core/Registry.js`.
6. If a new source file is added, include it in `tools/build-bundle.mjs`.

## License

MIT. See [LICENSE](LICENSE).
