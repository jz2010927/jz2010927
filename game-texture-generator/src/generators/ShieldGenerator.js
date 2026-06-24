import { fbm, worley } from "../noise/Noise.js";
import { clamp, hexToRgb, smoothstep } from "../utils/Color.js";
import { commit, distanceToCenter, getImageData, ringMask, setPixel } from "./GeneratorHelpers.js";

export const ShieldGenerator = {
  id: "shield",
  name: "能量护盾",
  description: "环形距离场、六边形单元与辉光",
  getDefaultParams() {
    return {
      Seed: "shield-001",
      Scale: 8,
      Distortion: 0.28,
      Density: 0.62,
      GlowStrength: 0.85,
      AnimationSpeed: 0.25,
      PrimaryColor: "#41d6ff",
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "Scale", label: "Cell Scale", type: "range", min: 2, max: 18, step: 0.1 },
      { key: "Density", label: "Density", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "Distortion", label: "Distortion", type: "range", min: 0, max: 1, step: 0.01 },
      { key: "GlowStrength", label: "Glow Strength", type: "range", min: 0, max: 1.5, step: 0.01 },
      { key: "AnimationSpeed", label: "Animation Speed", type: "range", min: 0, max: 1, step: 0.01 },
      { key: "PrimaryColor", label: "Primary Color", type: "color" },
    ];
  },
  generate(canvas, params, context = {}) {
    const { ctx, image, data, width, height } = getImageData(canvas);
    const color = hexToRgb(params.PrimaryColor);
    const time = (context.time || 0) * Number(params.AnimationSpeed || 0);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = x / width;
        const ny = y / height;
        const d = distanceToCenter(nx, ny);
        const distort = (fbm(nx * 4 + time, ny * 4, params.Seed, 4) - 0.5) * Number(params.Distortion);
        const shell = ringMask(d + distort * 0.12, 0.68, 0.18);
        const cell = worley(nx * Number(params.Scale), ny * Number(params.Scale) * 1.15, params.Seed);
        const grid = smoothstep(0.015, 0.08, cell.edge) * Number(params.Density);
        const glow = clamp((shell * 0.82 + grid * shell) * Number(params.GlowStrength));
        const inner = smoothstep(0.72, 0.05, d) * 0.1;
        setPixel(data, (y * width + x) * 4, [
          clamp(color[0] * glow + 12 + inner * color[0], 0, 255),
          clamp(color[1] * glow + 16 + inner * color[1], 0, 255),
          clamp(color[2] * glow + 22 + inner * color[2], 0, 255),
          255,
        ]);
      }
    }
    commit(ctx, image);
  },
};
