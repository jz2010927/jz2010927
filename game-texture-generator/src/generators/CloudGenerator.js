import { domainWarp, fbm } from "../noise/Noise.js";
import { clamp, smoothstep } from "../utils/Color.js";
import { colorStop, commit, getImageData, setPixel, shade } from "./GeneratorHelpers.js";

const cloudStops = [colorStop("#17202a", 0), colorStop("#6f8192", 0.45), colorStop("#f7fbff", 1)];

export const CloudGenerator = {
  id: "cloud",
  name: "云层",
  description: "多层 FBM 柔化云纹",
  getDefaultParams() {
    return {
      Seed: "cloud-001",
      Scale: 3,
      Contrast: 1.15,
      Brightness: 0.02,
      Octaves: 6,
      Persistence: 0.55,
      Lacunarity: 2,
      Density: 0.58,
      Smoothness: 0.72,
      AnimationSpeed: 0.15,
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "Scale", label: "Scale", type: "range", min: 0.5, max: 9, step: 0.1 },
      { key: "Density", label: "Density", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "Smoothness", label: "Smoothness", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "Contrast", label: "Contrast", type: "range", min: 0.4, max: 2.2, step: 0.05 },
      { key: "Brightness", label: "Brightness", type: "range", min: -0.3, max: 0.3, step: 0.01 },
      { key: "Octaves", label: "Octaves", type: "range", min: 1, max: 8, step: 1 },
      { key: "AnimationSpeed", label: "Animation Speed", type: "range", min: 0, max: 1.2, step: 0.01 },
    ];
  },
  generate(canvas, params, context = {}) {
    const { ctx, image, data, width, height } = getImageData(canvas);
    const time = (context.time || 0) * Number(params.AnimationSpeed || 0);
    const scale = Number(params.Scale);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = x / width;
        const ny = y / height;
        const [wx, wy] = domainWarp(nx * scale + time * 0.06, ny * scale, params.Seed, 0.35, 1);
        const n = fbm(wx, wy + time * 0.04, params.Seed, Number(params.Octaves), Number(params.Persistence), Number(params.Lacunarity));
        const alpha = smoothstep(1 - Number(params.Density), 1 - Number(params.Density) + Number(params.Smoothness) * 0.55, n);
        const color = shade(clamp(n * alpha + 0.12), params, cloudStops);
        color[3] = 255;
        setPixel(data, (y * width + x) * 4, color);
      }
    }
    commit(ctx, image);
  },
};
