export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function mixColor(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
    Math.round(lerp(a[3] ?? 255, b[3] ?? 255, t)),
  ];
}

export function gradient(stops, t) {
  const x = clamp(t);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const left = stops[i];
    const right = stops[i + 1];
    if (x >= left.at && x <= right.at) {
      return mixColor(left.color, right.color, (x - left.at) / (right.at - left.at || 1));
    }
  }
  return stops[x < stops[0].at ? 0 : stops.length - 1].color;
}

export function applyContrastBrightness(value, contrast, brightness) {
  return clamp((value - 0.5) * contrast + 0.5 + brightness);
}
