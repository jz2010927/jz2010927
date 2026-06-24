import { createRng } from "../utils/Random.js";
import { hexToRgb } from "../utils/Color.js";

function drawGlowLine(ctx, points, color, width, glow) {
  const [r, g, b] = hexToRgb(color);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 4; i >= 1; i -= 1) {
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.045 * glow * i})`;
    ctx.lineWidth = width * i * 3.2;
    ctx.beginPath();
    points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(255, 255, 255, 0.95)`;
  ctx.lineWidth = Math.max(1, width * 0.45);
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.stroke();
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.stroke();
}

function makeBolt(rng, start, end, displacement, depth) {
  let points = [start, end];
  for (let d = 0; d < depth; d += 1) {
    const next = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const mid = {
        x: (a.x + b.x) * 0.5 + (rng() - 0.5) * displacement,
        y: (a.y + b.y) * 0.5 + (rng() - 0.5) * displacement,
      };
      next.push(a, mid);
    }
    next.push(points[points.length - 1]);
    points = next;
    displacement *= 0.55;
  }
  return points;
}

export const LightningGenerator = {
  id: "lightning",
  name: "闪电",
  description: "分形闪电、分支与辉光",
  getDefaultParams() {
    return {
      Seed: "lightning-001",
      BranchCount: 6,
      Density: 0.65,
      GlowStrength: 0.75,
      PrimaryColor: "#7fdcff",
      AnimationSpeed: 0.25,
    };
  },
  getParamSchema() {
    return [
      { key: "Seed", label: "Seed", type: "text" },
      { key: "BranchCount", label: "Branch Count", type: "range", min: 0, max: 14, step: 1 },
      { key: "Density", label: "Density", type: "range", min: 0.1, max: 1, step: 0.01 },
      { key: "GlowStrength", label: "Glow Strength", type: "range", min: 0, max: 1.5, step: 0.01 },
      { key: "PrimaryColor", label: "Primary Color", type: "color" },
      { key: "AnimationSpeed", label: "Animation Speed", type: "range", min: 0, max: 1, step: 0.01 },
    ];
  },
  generate(canvas, params, context = {}) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const frameSeed = context.exporting ? params.Seed : `${params.Seed}:${Math.floor((context.time || 0) * Number(params.AnimationSpeed || 0) * 8)}`;
    const rng = createRng(frameSeed);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#06080d";
    ctx.fillRect(0, 0, width, height);
    const start = { x: width * (0.22 + rng() * 0.16), y: height * 0.08 };
    const end = { x: width * (0.58 + rng() * 0.2), y: height * 0.92 };
    const main = makeBolt(rng, start, end, width * Number(params.Density) * 0.35, 7);
    drawGlowLine(ctx, main, params.PrimaryColor, width * 0.006, Number(params.GlowStrength));
    for (let i = 0; i < Number(params.BranchCount); i += 1) {
      const origin = main[Math.floor(rng() * (main.length - 2)) + 1];
      const length = height * (0.12 + rng() * 0.2);
      const angle = (-0.9 + rng() * 1.8) + Math.PI * 0.5;
      const target = { x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length };
      const branch = makeBolt(rng, origin, target, width * 0.09, 4);
      drawGlowLine(ctx, branch, params.PrimaryColor, width * 0.0035, Number(params.GlowStrength) * 0.8);
    }
  },
};
