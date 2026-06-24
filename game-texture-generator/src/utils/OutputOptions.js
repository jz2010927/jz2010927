import { hexToRgb } from "./Color.js";

export const MAX_EXPORT_SIZE = 8192;
export const MAP_TYPES = ["color", "height", "normal", "roughness", "alpha", "emissive"];

export function clampOutputSize(value, fallback = 512) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(MAX_EXPORT_SIZE, Math.max(1, number));
}

export function applyOutputOptions(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = source.data;
  const background = hexToRgb(options.backgroundColor || "#050606");
  const transparent = Boolean(options.transparentNoise);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const luminance = (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255;

    if (transparent) {
      data[i + 3] = Math.round(luminance * 255);
    } else {
      data[i] = Math.round(data[i] * alpha + background[0] * (1 - alpha));
      data[i + 1] = Math.round(data[i + 1] * alpha + background[1] * (1 - alpha));
      data[i + 2] = Math.round(data[i + 2] * alpha + background[2] * (1 - alpha));
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(source, 0, 0);
}

function luminanceAt(data, index) {
  return (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722) / 255;
}

function setGray(data, index, value) {
  const gray = Math.round(Math.min(1, Math.max(0, value)) * 255);
  data[index] = gray;
  data[index + 1] = gray;
  data[index + 2] = gray;
  data[index + 3] = 255;
}

function isEmissiveGenerator(generatorId = "") {
  return /fire|flame|lava|lightning|electric|tesla|shield|field|portal|laser|beam|magic|rune|rift|glow|light|volcano/.test(generatorId);
}

export function applyTileableBlend(canvas, options = {}) {
  if (!options.tileable) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const { width, height } = canvas;
  const edge = Math.max(2, Math.round(Math.min(width, height) * 0.08));
  const copy = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const leftWeight = x < edge ? (edge - x) / edge : 0;
      const rightWeight = x >= width - edge ? (x - (width - edge - 1)) / edge : 0;
      const topWeight = y < edge ? (edge - y) / edge : 0;
      const bottomWeight = y >= height - edge ? (y - (height - edge - 1)) / edge : 0;
      const weight = Math.max(leftWeight, rightWeight, topWeight, bottomWeight);
      if (!weight) continue;
      const sourceIndex = (y * width + x) * 4;
      const wrapX = leftWeight ? width - edge + x : rightWeight ? x - width + edge : x;
      const wrapY = topWeight ? height - edge + y : bottomWeight ? y - height + edge : y;
      const wrapIndex = ((Math.max(0, Math.min(height - 1, wrapY)) * width) + Math.max(0, Math.min(width - 1, wrapX))) * 4;
      for (let c = 0; c < 4; c += 1) {
        data[sourceIndex + c] = Math.round(copy[sourceIndex + c] * (1 - weight) + copy[wrapIndex + c] * weight);
      }
    }
  }

  for (let y = 0; y < height; y += 1) {
    const left = (y * width) * 4;
    const right = (y * width + width - 1) * 4;
    for (let c = 0; c < 4; c += 1) {
      const avg = Math.round((data[left + c] + data[right + c]) * 0.5);
      data[left + c] = avg;
      data[right + c] = avg;
    }
  }
  for (let x = 0; x < width; x += 1) {
    const top = x * 4;
    const bottom = ((height - 1) * width + x) * 4;
    for (let c = 0; c < 4; c += 1) {
      const avg = Math.round((data[top + c] + data[bottom + c]) * 0.5);
      data[top + c] = avg;
      data[bottom + c] = avg;
    }
  }

  ctx.putImageData(image, 0, 0);
}

export function buildDerivedMap(canvas, mapType = "color", options = {}) {
  if (mapType === "color") return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const source = new Uint8ClampedArray(data);
  const { width, height } = canvas;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const lum = luminanceAt(source, index);
      if (mapType === "height") {
        setGray(data, index, lum);
      } else if (mapType === "roughness") {
        const rough = options.generatorId && isEmissiveGenerator(options.generatorId) ? 1 - lum * 0.55 : 0.35 + (1 - lum) * 0.6;
        setGray(data, index, rough);
      } else if (mapType === "alpha") {
        setGray(data, index, source[index + 3] / 255 || lum);
      } else if (mapType === "emissive") {
        const value = isEmissiveGenerator(options.generatorId) ? Math.max(0, (lum - 0.45) / 0.55) : 0;
        data[index] = Math.round(source[index] * value);
        data[index + 1] = Math.round(source[index + 1] * value);
        data[index + 2] = Math.round(source[index + 2] * value);
        data[index + 3] = 255;
      } else if (mapType === "normal") {
        const xl = (y * width + ((x - 1 + width) % width)) * 4;
        const xr = (y * width + ((x + 1) % width)) * 4;
        const yu = (((y - 1 + height) % height) * width + x) * 4;
        const yd = (((y + 1) % height) * width + x) * 4;
        const dx = luminanceAt(source, xl) - luminanceAt(source, xr);
        const dy = luminanceAt(source, yu) - luminanceAt(source, yd);
        const strength = 3.2;
        const nx = dx * strength;
        const ny = dy * strength;
        const nz = 1;
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        data[index] = Math.round((nx / length * 0.5 + 0.5) * 255);
        data[index + 1] = Math.round((ny / length * 0.5 + 0.5) * 255);
        data[index + 2] = Math.round((nz / length * 0.5 + 0.5) * 255);
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(image, 0, 0);
}
