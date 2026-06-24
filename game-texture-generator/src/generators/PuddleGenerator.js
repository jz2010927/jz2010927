import { fbm, worley } from "../noise/Noise.js";
import { clamp, hexToRgb, smoothstep } from "../utils/Color.js";
import { commit, getImageData, setPixel } from "./GeneratorHelpers.js";

export const PuddleGenerator = {
  id: "puddle",
  name: "水洼",
  description: "Voronoi 湿润边缘与高光",
  getDefaultParams() {
    return {
      Seed: "puddle-001",
      Scale: 6,
      Contrast: 1.2,
      Brightness: 0,
      Smoothness: 0.55,
      Distortion: 0.32,
      PrimaryColor: "#406d7f",
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "Scale", label: "Scale", type: "range", min: 1, max: 14, step: 0.1 },
      { key: "Smoothness", label: "Smoothness", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "Distortion", label: "Distortion", type: "range", min: 0, max: 1, step: 0.01 },
      { key: "Contrast", label: "Contrast", type: "range", min: 0.4, max: 2.5, step: 0.05 },
      { key: "Brightness", label: "Brightness", type: "range", min: -0.35, max: 0.35, step: 0.01 },
      { key: "PrimaryColor", label: "Primary Color", type: "color" },
    ];
  },
  generate(canvas, params) {
    const { ctx, image, data, width, height } = getImageData(canvas);
    const base = hexToRgb(params.PrimaryColor);
    const scale = Number(params.Scale);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = x / width;
        const ny = y / height;
        const ripple = fbm(nx * scale * 1.7, ny * scale * 1.7, params.Seed, 4, 0.48, 2);
        const cell = worley(nx * scale + ripple * Number(params.Distortion), ny * scale, params.Seed);
        const body = smoothstep(0.08, Number(params.Smoothness), 1 - cell.f1);
        const edge = smoothstep(0.03, 0.18, cell.edge);
        const shine = Math.pow(clamp(fbm(nx * 18, ny * 18, `${params.Seed}:shine`, 3) - 0.42), 2) * 3;
        const wet = clamp(body * 0.78 + edge * 0.2 + shine);
        const color = [
          clamp(base[0] * wet + 18 * (1 - wet) + shine * 170, 0, 255),
          clamp(base[1] * wet + 22 * (1 - wet) + shine * 190, 0, 255),
          clamp(base[2] * wet + 24 * (1 - wet) + shine * 210, 0, 255),
          255,
        ];
        setPixel(data, (y * width + x) * 4, color);
      }
    }
    commit(ctx, image);
  },
};
