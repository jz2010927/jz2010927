import { domainWarp, fbm } from "../noise/Noise.js";
import { clamp, smoothstep } from "../utils/Color.js";
import { colorStop, commit, getImageData, setPixel, shade } from "./GeneratorHelpers.js";

const fireStops = [
  colorStop("#120405", 0),
  colorStop("#6d1307", 0.32),
  colorStop("#e54d12", 0.58),
  colorStop("#ffd35c", 0.82),
  colorStop("#fff6d3", 1),
];

export const FireGenerator = {
  id: "fire",
  name: "火焰",
  description: "垂直流动噪声与热色渐变",
  getDefaultParams() {
    return {
      Seed: "fire-001",
      Scale: 4,
      Contrast: 1.35,
      Brightness: 0.02,
      Octaves: 5,
      Persistence: 0.52,
      Lacunarity: 2,
      Density: 0.72,
      GlowStrength: 0.7,
      AnimationSpeed: 0.55,
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "Scale", label: "Scale", type: "range", min: 0.8, max: 10, step: 0.1 },
      { key: "Density", label: "Density", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "GlowStrength", label: "Glow Strength", type: "range", min: 0, max: 1.5, step: 0.01 },
      { key: "Contrast", label: "Contrast", type: "range", min: 0.5, max: 3, step: 0.05 },
      { key: "Brightness", label: "Brightness", type: "range", min: -0.3, max: 0.4, step: 0.01 },
      { key: "AnimationSpeed", label: "Animation Speed", type: "range", min: 0, max: 1.4, step: 0.01 },
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
        const uplift = 1 - ny;
        const [wx, wy] = domainWarp(nx * scale, ny * scale - time * 0.8, params.Seed, 0.5, 1);
        const plume = fbm(wx, wy, params.Seed, Number(params.Octaves), Number(params.Persistence), Number(params.Lacunarity));
        const column = smoothstep(0.02, 0.55, 1 - Math.abs(nx - 0.5) * 1.8);
        const heat = clamp((plume * Number(params.Density) + uplift * 0.85) * column);
        const color = shade(heat, params, fireStops);
        const glow = smoothstep(0.45, 1, heat) * Number(params.GlowStrength);
        color[0] = clamp(color[0] + glow * 45, 0, 255);
        color[1] = clamp(color[1] + glow * 24, 0, 255);
        setPixel(data, (y * width + x) * 4, color);
      }
    }
    commit(ctx, image);
  },
};
