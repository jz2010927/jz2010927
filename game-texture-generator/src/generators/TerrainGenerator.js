import { domainWarp, fbm } from "../noise/Noise.js";
import { colorStop, commit, getImageData, setPixel, shade } from "./GeneratorHelpers.js";

const terrainStops = [
  colorStop("#10263f", 0),
  colorStop("#1f5c77", 0.28),
  colorStop("#2f7347", 0.42),
  colorStop("#8a874f", 0.62),
  colorStop("#7b6d65", 0.78),
  colorStop("#e5e9e2", 1),
];

export const TerrainGenerator = {
  id: "terrain",
  name: "地形高度图",
  description: "FBM 高度图与地貌渐变",
  getDefaultParams() {
    return {
      Seed: "terrain-001",
      Scale: 4,
      Contrast: 1.25,
      Brightness: 0,
      Octaves: 6,
      Persistence: 0.5,
      Lacunarity: 2,
      Distortion: 0.15,
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "Scale", label: "Scale", type: "range", min: 0.5, max: 10, step: 0.1 },
      { key: "Contrast", label: "Contrast", type: "range", min: 0.4, max: 2.5, step: 0.05 },
      { key: "Brightness", label: "Brightness", type: "range", min: -0.35, max: 0.35, step: 0.01 },
      { key: "Octaves", label: "Octaves", type: "range", min: 1, max: 8, step: 1 },
      { key: "Persistence", label: "Persistence", type: "range", min: 0.25, max: 0.85, step: 0.01 },
      { key: "Lacunarity", label: "Lacunarity", type: "range", min: 1.4, max: 3.2, step: 0.05 },
      { key: "Distortion", label: "Distortion", type: "range", min: 0, max: 0.8, step: 0.01 },
    ];
  },
  generate(canvas, params) {
    const { ctx, image, data, width, height } = getImageData(canvas);
    const scale = Number(params.Scale);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = x / width;
        const ny = y / height;
        const [wx, wy] = domainWarp(nx * scale, ny * scale, params.Seed, Number(params.Distortion), 1);
        const elevation = fbm(wx, wy, params.Seed, Number(params.Octaves), Number(params.Persistence), Number(params.Lacunarity));
        setPixel(data, (y * width + x) * 4, shade(elevation, params, terrainStops));
      }
    }
    commit(ctx, image);
  },
};
