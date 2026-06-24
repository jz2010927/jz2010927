import { domainWarp, fbm } from "../noise/Noise.js";
import { clamp, smoothstep } from "../utils/Color.js";
import { colorStop, commit, getImageData, setPixel, shade } from "./GeneratorHelpers.js";

const fogStops = [colorStop("#1b2022", 0), colorStop("#758083", 0.55), colorStop("#d7e4df", 1)];

export const FogGenerator = {
  id: "fog",
  name: "雾",
  description: "低频流动雾纹与战争迷雾底图",
  getDefaultParams() {
    return {
      Seed: "fog-001",
      Scale: 2.2,
      Contrast: 0.95,
      Brightness: 0.03,
      Octaves: 5,
      Persistence: 0.58,
      Lacunarity: 1.9,
      Density: 0.55,
      Smoothness: 0.85,
      AnimationSpeed: 0.3,
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "Scale", label: "Scale", type: "range", min: 0.4, max: 7, step: 0.1 },
      { key: "Density", label: "Density", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "Smoothness", label: "Smoothness", type: "range", min: 0.2, max: 1, step: 0.01 },
      { key: "Contrast", label: "Contrast", type: "range", min: 0.3, max: 2, step: 0.05 },
      { key: "Brightness", label: "Brightness", type: "range", min: -0.3, max: 0.3, step: 0.01 },
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
        const [wx, wy] = domainWarp(nx * scale + time * 0.05, ny * scale - time * 0.03, params.Seed, 0.45, 0.8);
        const n = fbm(wx, wy, params.Seed, Number(params.Octaves), Number(params.Persistence), Number(params.Lacunarity));
        const veil = smoothstep(1 - Number(params.Density), 1 - Number(params.Density) + Number(params.Smoothness), n);
        setPixel(data, (y * width + x) * 4, shade(clamp(veil * 0.85 + n * 0.2), params, fogStops));
      }
    }
    commit(ctx, image);
  },
};
