import { applyContrastBrightness, clamp, gradient, hexToRgb, smoothstep } from "../utils/Color.js";

export const commonSchema = [
  { key: "Seed", label: "Seed", type: "text" },
  { key: "Scale", label: "Scale", type: "range", min: 0.5, max: 12, step: 0.1 },
  { key: "Contrast", label: "Contrast", type: "range", min: 0.2, max: 3, step: 0.05 },
  { key: "Brightness", label: "Brightness", type: "range", min: -0.5, max: 0.5, step: 0.01 },
  { key: "Octaves", label: "Octaves", type: "range", min: 1, max: 8, step: 1 },
  { key: "Persistence", label: "Persistence", type: "range", min: 0.2, max: 0.9, step: 0.01 },
  { key: "Lacunarity", label: "Lacunarity", type: "range", min: 1.2, max: 3.5, step: 0.05 },
];

export function getImageData(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.createImageData(canvas.width, canvas.height);
  return { ctx, image, data: image.data, width: canvas.width, height: canvas.height };
}

export function commit(ctx, image) {
  ctx.putImageData(image, 0, 0);
}

export function setPixel(data, index, color) {
  data[index] = color[0];
  data[index + 1] = color[1];
  data[index + 2] = color[2];
  data[index + 3] = color[3] ?? 255;
}

export function shade(value, params, stops) {
  const adjusted = applyContrastBrightness(value, Number(params.Contrast ?? 1), Number(params.Brightness ?? 0));
  return gradient(stops, adjusted);
}

export function colorStop(hex, at, alpha = 255) {
  return { at, color: [...hexToRgb(hex), alpha] };
}

export function distanceToCenter(nx, ny) {
  const dx = nx - 0.5;
  const dy = ny - 0.5;
  return Math.sqrt(dx * dx + dy * dy) * 2;
}

export function ringMask(distance, radius, width) {
  return 1 - smoothstep(width * 0.5, width, Math.abs(distance - radius));
}

export function normalizeParam(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function rgba(color, alpha = 255) {
  return [color[0], color[1], color[2], clamp(alpha / 255) * 255];
}
