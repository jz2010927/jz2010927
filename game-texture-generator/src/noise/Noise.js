import { createRng, hashString } from "../utils/Random.js";
import { clamp, lerp, smoothstep } from "../utils/Color.js";

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function hash2(seed, x, y) {
  let h = hashString(seed);
  h ^= Math.imul(x | 0, 374761393);
  h ^= Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function grad(seed, x, y) {
  const angle = hash2(seed, x, y) * Math.PI * 2;
  return [Math.cos(angle), Math.sin(angle)];
}

export function whiteNoise(x, y, seed) {
  return hash2(seed, Math.floor(x * 100000), Math.floor(y * 100000));
}

export function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(0, 1, x - x0);
  const ty = smoothstep(0, 1, y - y0);
  const a = hash2(seed, x0, y0);
  const b = hash2(seed, x0 + 1, y0);
  const c = hash2(seed, x0, y0 + 1);
  const d = hash2(seed, x0 + 1, y0 + 1);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

export function perlinNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const g00 = grad(seed, x0, y0);
  const g10 = grad(seed, x0 + 1, y0);
  const g01 = grad(seed, x0, y0 + 1);
  const g11 = grad(seed, x0 + 1, y0 + 1);
  const d00 = g00[0] * xf + g00[1] * yf;
  const d10 = g10[0] * (xf - 1) + g10[1] * yf;
  const d01 = g01[0] * xf + g01[1] * (yf - 1);
  const d11 = g11[0] * (xf - 1) + g11[1] * (yf - 1);
  const u = fade(xf);
  const v = fade(yf);
  return clamp(lerp(lerp(d00, d10, u), lerp(d01, d11, u), v) * 0.75 + 0.5);
}

export function fbm(x, y, seed, octaves = 5, persistence = 0.5, lacunarity = 2, noiseFn = perlinNoise) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += noiseFn(x * frequency, y * frequency, `${seed}:${i}`) * amplitude;
    total += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return total ? value / total : value;
}

export function worley(x, y, seed, jitter = 0.9) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  let minDist = Infinity;
  let secondDist = Infinity;
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      const px = cellX + ox;
      const py = cellY + oy;
      const rng = createRng(`${seed}:${px}:${py}`);
      const fx = px + rng() * jitter + (1 - jitter) * 0.5;
      const fy = py + rng() * jitter + (1 - jitter) * 0.5;
      const dx = fx - x;
      const dy = fy - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        secondDist = minDist;
        minDist = d;
      } else if (d < secondDist) {
        secondDist = d;
      }
    }
  }
  return { f1: clamp(minDist), f2: clamp(secondDist), edge: clamp(secondDist - minDist) };
}

export function voronoi(x, y, seed) {
  return 1 - worley(x, y, seed).f1;
}

export function domainWarp(x, y, seed, amount = 0.25, scale = 1) {
  const wx = fbm(x * scale + 11.3, y * scale + 4.7, `${seed}:warp-x`, 4) - 0.5;
  const wy = fbm(x * scale - 8.9, y * scale + 19.1, `${seed}:warp-y`, 4) - 0.5;
  return [x + wx * amount, y + wy * amount];
}
