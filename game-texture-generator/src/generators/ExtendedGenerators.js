import { domainWarp, fbm, valueNoise, worley } from "../noise/Noise.js";
import { clamp, gradient, hexToRgb, lerp, smoothstep } from "../utils/Color.js";
import { createRng } from "../utils/Random.js";
import { colorStop, commit, distanceToCenter, getImageData, ringMask, setPixel } from "./GeneratorHelpers.js";

const COMMON_SCHEMA = [
  { key: "Seed", label: "Seed", type: "text" },
  { key: "Scale", label: "Scale", type: "range", min: 0.4, max: 24, step: 0.1 },
  { key: "Density", label: "Density", type: "range", min: 0.05, max: 1.5, step: 0.01 },
  { key: "Contrast", label: "Contrast", type: "range", min: 0.3, max: 3.5, step: 0.05 },
  { key: "Brightness", label: "Brightness", type: "range", min: -0.6, max: 0.6, step: 0.01 },
  { key: "Distortion", label: "Distortion", type: "range", min: 0, max: 1.5, step: 0.01 },
  { key: "Detail", label: "Detail", type: "range", min: 1, max: 8, step: 1 },
  { key: "PrimaryColor", label: "Primary Color", type: "color" },
  { key: "SecondaryColor", label: "Secondary Color", type: "color" },
];

function fieldParams(seed, overrides = {}) {
  return {
    Seed: seed,
    Scale: 6,
    Density: 0.75,
    Contrast: 1.25,
    Brightness: 0,
    Distortion: 0.28,
    Detail: 5,
    PrimaryColor: "#67d5ff",
    SecondaryColor: "#10151c",
    ...overrides,
  };
}

function adjusted(value, params) {
  return clamp((value - 0.5) * Number(params.Contrast ?? 1) + 0.5 + Number(params.Brightness ?? 0));
}

function noiseAt(nx, ny, params, salt = "base") {
  const scale = Number(params.Scale);
  const distortion = Number(params.Distortion);
  const [wx, wy] = domainWarp(nx * scale, ny * scale, `${params.Seed}:${salt}`, distortion, 1.15);
  return fbm(wx, wy, `${params.Seed}:${salt}`, Number(params.Detail), 0.54, 2.03);
}

function palette(stops, value, params) {
  return gradient(stops, adjusted(value, params));
}

function mixRgb(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
    255,
  ];
}

function radial(nx, ny, cx = 0.5, cy = 0.5) {
  const dx = nx - cx;
  const dy = ny - cy;
  return Math.sqrt(dx * dx + dy * dy) * 2;
}

function angle01(nx, ny) {
  return (Math.atan2(ny - 0.5, nx - 0.5) + Math.PI) / (Math.PI * 2);
}

function drawField(canvas, params, config) {
  const { ctx, image, data, width, height } = getImageData(canvas);
  const primary = hexToRgb(params.PrimaryColor);
  const secondary = hexToRgb(params.SecondaryColor);
  const stops = config.stops || [colorStop(params.SecondaryColor, 0), colorStop(params.PrimaryColor, 1)];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / width;
      const ny = y / height;
      const n = noiseAt(nx, ny, params);
      const detail = noiseAt(nx * 1.7 + 0.11, ny * 1.7 - 0.07, params, "detail");
      const cell = worley(nx * Number(params.Scale), ny * Number(params.Scale), params.Seed);
      const d = radial(nx, ny);
      const a = angle01(nx, ny);
      let v = n;
      let color = null;

      switch (config.mode) {
        case "island":
          v = n * smoothstep(1, 0.18, d);
          break;
        case "continent":
          v = smoothstep(0.34, 0.78, n + smoothstep(1.15, 0.25, d) * 0.35);
          break;
        case "mountain":
          v = 1 - Math.abs(n * 2 - 1);
          v = clamp(v * v * 1.35 + detail * 0.25);
          break;
        case "canyon": {
          const cut = Math.abs(nx - 0.5 + Math.sin(ny * 9 + detail * 4) * 0.12);
          v = clamp(n * 0.45 + smoothstep(0.42, 0.02, cut) * 0.75);
          break;
        }
        case "river": {
          const center = 0.5 + Math.sin(ny * 7 + detail * 5) * 0.18;
          const channel = smoothstep(0.11, 0.01, Math.abs(nx - center));
          v = clamp(n * 0.28 + channel);
          break;
        }
        case "lake":
          v = clamp((1 - cell.f1) * 0.9 + smoothstep(0.85, 0.25, d) * 0.35 + n * 0.2);
          break;
        case "volcano":
          v = clamp(ringMask(d, 0.48, 0.26) * 0.9 + smoothstep(0.3, 0.02, d) * 0.9 + n * 0.2);
          break;
        case "biome":
          v = Math.floor(clamp(n * 0.65 + ny * 0.35) * 5) / 4;
          break;
        case "resource":
          v = smoothstep(0.72, 0.12, cell.f1) * Number(params.Density) + n * 0.28;
          break;
        case "grass":
          v = clamp(n * 0.65 + valueNoise(x * 0.08, y * 0.9, params.Seed) * 0.35);
          break;
        case "sand":
          v = clamp(n * 0.35 + (Math.sin((nx + detail * 0.08) * 55) * 0.5 + 0.5) * 0.45);
          break;
        case "rock":
          v = clamp((1 - cell.edge) * 0.75 + n * 0.35);
          break;
        case "swamp":
          v = clamp(n * 0.5 + smoothstep(0.55, 0.05, cell.f1) * 0.5);
          break;
        case "lava":
          v = clamp((1 - smoothstep(0.02, 0.18, cell.edge)) * 0.85 + n * 0.45);
          break;
        case "liquid":
          v = clamp(smoothstep(0.65, 0.15, cell.f1) * 0.55 + n * 0.55);
          break;
        case "oil":
          color = mixRgb(
            mixRgb(secondary, primary, n),
            [160 + detail * 70, 80 + n * 80, 210 + cell.f1 * 35, 255],
            smoothstep(0.72, 1, Math.sin((nx + ny + detail) * 18) * 0.5 + 0.5),
          );
          break;
        case "waves":
          v = clamp(n * 0.35 + (Math.sin((ny + detail * 0.12) * 70) * 0.5 + 0.5) * 0.55);
          break;
        case "vortex":
          v = clamp(n * 0.35 + (Math.sin((a * 8 - d * 5 + detail) * Math.PI * 2) * 0.5 + 0.5) * smoothstep(1.05, 0.08, d));
          break;
        case "waterfall":
          v = clamp(n * 0.32 + valueNoise(x * 0.2, y * 1.4, params.Seed) * 0.62 + smoothstep(0.95, 0.15, ny) * 0.2);
          break;
        case "metal":
          v = clamp(n * 0.28 + (Math.sin((nx + ny * 0.22 + detail * 0.08) * 46) * 0.5 + 0.5) * 0.72);
          break;
        case "storm":
          v = clamp(n * 0.55 + (Math.sin((a * 2.6 + d * 2.1 + detail) * Math.PI * 2) * 0.5 + 0.5) * 0.45);
          break;
        case "fog-war":
          v = clamp(n * 0.52 + smoothstep(0.22, 0.75, detail) * 0.25 + smoothstep(0.9, 0.25, d) * 0.18);
          break;
        case "rain":
          v = clamp(n * 0.22 + smoothstep(0.86, 1, Math.sin((nx * 28 + ny * 82 + detail * 4))) * 0.95);
          break;
        case "snowfall":
          v = clamp(n * 0.25 + smoothstep(0.82, 0.98, valueNoise(x * 0.15, y * 0.15, params.Seed)) * 0.85);
          break;
        case "sandstorm":
          v = clamp(n * 0.4 + (Math.sin((nx * 10 + ny * 25 + detail * 3)) * 0.5 + 0.5) * 0.55);
          break;
        case "light":
          v = smoothstep(1.05, 0.02, d) * Number(params.Density);
          break;
        case "spotlight": {
          const beam = smoothstep(0.42, 0.02, Math.abs(nx - 0.5) + ny * 0.22);
          v = clamp(beam * smoothstep(1.05, 0.05, ny));
          break;
        }
        case "beam":
          v = clamp(smoothstep(0.13, 0.01, Math.abs(ny - 0.5 + Math.sin(nx * 7) * 0.025)) + n * 0.18);
          break;
        case "magic-circle":
          v = clamp(ringMask(d, 0.72, 0.09) + ringMask(d, 0.42, 0.05) + smoothstep(0.99, 0.94, Math.sin(a * Math.PI * 24)) * ringMask(d, 0.58, 0.18));
          break;
        case "rune":
          v = clamp((1 - smoothstep(0.01, 0.05, Math.abs(Math.sin((nx * 5 + ny * 7 + detail) * Math.PI)))) * ringMask(d, 0.62, 0.34));
          break;
        case "rift":
          v = clamp(smoothstep(0.18, 0.01, Math.abs(nx - 0.5 + Math.sin(ny * 14 + detail * 5) * 0.1)) + n * 0.3);
          break;
        case "heatmap":
          v = clamp(smoothstep(0.7, 0.05, cell.f1) * 0.7 + n * 0.35);
          break;
        default:
          v = n;
      }

      if (!color) color = palette(stops, clamp(v), params);
      setPixel(data, (y * width + x) * 4, color);
    }
  }
  commit(ctx, image);
}

function makeFieldGenerator(config) {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    getDefaultParams() {
      return fieldParams(config.seed || `${config.id}-001`, config.defaults);
    },
    getParamSchema() {
      return COMMON_SCHEMA.map((field) => ({ ...field, ...(config.schema?.[field.key] || {}) }));
    },
    generate(canvas, params) {
      drawField(canvas, params, config);
    },
  };
}

function extDrawGlowLine(ctx, points, color, width, glow) {
  const [r, g, b] = hexToRgb(color);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 5; i >= 1; i -= 1) {
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.035 * glow * i})`;
    ctx.lineWidth = width * i * 3.4;
    ctx.beginPath();
    points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(1, width * 0.38);
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.stroke();
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.stroke();
}

function extBolt(rng, start, end, displacement, depth) {
  let points = [start, end];
  for (let d = 0; d < depth; d += 1) {
    const next = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      next.push(a, {
        x: (a.x + b.x) * 0.5 + (rng() - 0.5) * displacement,
        y: (a.y + b.y) * 0.5 + (rng() - 0.5) * displacement,
      });
    }
    next.push(points[points.length - 1]);
    points = next;
    displacement *= 0.55;
  }
  return points;
}

function makeLightningVariant(config) {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    getDefaultParams() {
      return {
        Seed: `${config.id}-001`,
        BranchCount: config.branches ?? 5,
        Density: config.density ?? 0.65,
        GlowStrength: config.glow ?? 0.8,
        PrimaryColor: config.color || "#7fdcff",
      };
    },
    getParamSchema() {
      return [
        { key: "Seed", label: "Seed", type: "text" },
        { key: "BranchCount", label: "Branch Count", type: "range", min: 0, max: 22, step: 1 },
        { key: "Density", label: "Density", type: "range", min: 0.05, max: 1.2, step: 0.01 },
        { key: "GlowStrength", label: "Glow Strength", type: "range", min: 0, max: 2, step: 0.01 },
        { key: "PrimaryColor", label: "Primary Color", type: "color" },
      ];
    },
    generate(canvas, params) {
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;
      const rng = createRng(params.Seed);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, width, height);
      const nodes = [];
      const count = config.mode === "chain" ? 5 : config.mode === "grid" ? 9 : 2;
      for (let i = 0; i < count; i += 1) {
        nodes.push({ x: width * (0.12 + rng() * 0.76), y: height * (0.12 + rng() * 0.76) });
      }
      if (config.mode === "arc") {
        nodes[0] = { x: width * 0.18, y: height * 0.55 };
        nodes[1] = { x: width * 0.82, y: height * 0.45 };
      } else if (config.mode === "tesla") {
        nodes[0] = { x: width * 0.5, y: height * 0.5 };
      }
      const segments = config.mode === "grid" ? 12 : config.mode === "tesla" ? Number(params.BranchCount) + 8 : nodes.length - 1;
      for (let i = 0; i < segments; i += 1) {
        const start = config.mode === "tesla" ? nodes[0] : nodes[i % nodes.length];
        const end = config.mode === "tesla"
          ? { x: width * (0.08 + rng() * 0.84), y: height * (0.08 + rng() * 0.84) }
          : nodes[(i + 1 + Math.floor(rng() * Math.max(1, nodes.length - 1))) % nodes.length];
        const bolt = extBolt(rng, start, end, width * Number(params.Density) * (config.mode === "arc" ? 0.16 : 0.24), config.mode === "arc" ? 5 : 6);
        extDrawGlowLine(ctx, bolt, params.PrimaryColor, width * (config.mode === "grid" ? 0.0035 : 0.0055), Number(params.GlowStrength));
      }
    },
  };
}

function makeFireVariant(config) {
  const stops = config.stops;
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    getDefaultParams() {
      return fieldParams(`${config.id}-001`, {
        Scale: config.scale ?? 4.5,
        Density: config.density ?? 0.8,
        Contrast: 1.45,
        Brightness: 0.02,
        Distortion: 0.55,
        Detail: 5,
        PrimaryColor: config.primary,
        SecondaryColor: "#090405",
      });
    },
    getParamSchema() {
      return COMMON_SCHEMA;
    },
    generate(canvas, params) {
      const { ctx, image, data, width, height } = getImageData(canvas);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const nx = x / width;
          const ny = y / height;
          const n = noiseAt(nx, ny, params);
          const d = distanceToCenter(nx, ny);
          let mask = 1 - ny;
          if (config.mode === "campfire") mask *= smoothstep(0.02, 0.54, 1 - Math.abs(nx - 0.5) * 1.9);
          if (config.mode === "flamethrower") mask = smoothstep(0.08, 0.72, nx) * smoothstep(0.42, 0.02, Math.abs(ny - 0.5 + Math.sin(nx * 7) * 0.08));
          if (config.mode === "fireball") mask = smoothstep(1.05, 0.08, d);
          if (config.mode === "thruster") mask = smoothstep(0.08, 0.85, ny) * smoothstep(0.58, 0.02, Math.abs(nx - 0.5) + ny * 0.22);
          const heat = clamp((n * Number(params.Density) + mask * 0.9) * mask);
          setPixel(data, (y * width + x) * 4, palette(stops, heat, params));
        }
      }
      commit(ctx, image);
    },
  };
}

function makeShieldVariant(config) {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    getDefaultParams() {
      return fieldParams(`${config.id}-001`, {
        Scale: config.scale ?? 10,
        Density: config.density ?? 0.72,
        Contrast: 1.3,
        Brightness: 0,
        Distortion: config.distortion ?? 0.25,
        Detail: 4,
        PrimaryColor: config.color || "#41d6ff",
        SecondaryColor: "#030810",
      });
    },
    getParamSchema() {
      return COMMON_SCHEMA;
    },
    generate(canvas, params) {
      const { ctx, image, data, width, height } = getImageData(canvas);
      const primary = hexToRgb(params.PrimaryColor);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const nx = x / width;
          const ny = y / height;
          const d = distanceToCenter(nx, ny);
          const n = noiseAt(nx, ny, params);
          const cell = worley(nx * Number(params.Scale), ny * Number(params.Scale) * 1.12, params.Seed);
          let energy = ringMask(d + (n - 0.5) * Number(params.Distortion) * 0.18, 0.68, 0.2);
          if (config.mode === "hex") energy = clamp(energy + (1 - smoothstep(0.015, 0.08, cell.edge)) * energy * Number(params.Density));
          if (config.mode === "field") energy = clamp(smoothstep(1.1, 0.08, d) * 0.25 + (1 - smoothstep(0.04, 0.18, cell.edge)) * 0.5 + n * 0.25);
          if (config.mode === "portal") energy = clamp(ringMask(d, 0.52, 0.18) + (Math.sin((angle01(nx, ny) * 9 + d * 4 + n) * Math.PI * 2) * 0.5 + 0.5) * ringMask(d, 0.55, 0.35));
          const glow = clamp(energy);
          setPixel(data, (y * width + x) * 4, [
            clamp(primary[0] * glow + 8, 0, 255),
            clamp(primary[1] * glow + 12, 0, 255),
            clamp(primary[2] * glow + 18, 0, 255),
            255,
          ]);
        }
      }
      commit(ctx, image);
    },
  };
}

const extFireStops = [colorStop("#110204", 0), colorStop("#761006", 0.28), colorStop("#ec4d11", 0.58), colorStop("#ffd35c", 0.84), colorStop("#fff8d8", 1)];
const extIceFireStops = [colorStop("#020615", 0), colorStop("#12407e", 0.35), colorStop("#39e7ff", 0.74), colorStop("#e9feff", 1)];
const extPoisonFireStops = [colorStop("#071207", 0), colorStop("#11691b", 0.35), colorStop("#9dff38", 0.78), colorStop("#efffd1", 1)];
const extSoulFireStops = [colorStop("#080414", 0), colorStop("#37228e", 0.38), colorStop("#36b7ff", 0.72), colorStop("#f4f0ff", 1)];

export const extendedGenerators = [
  makeFieldGenerator({ id: "island", name: "岛屿", description: "径向衰减的岛屿高度图", mode: "island", defaults: { Scale: 4.8, Density: 0.8, PrimaryColor: "#d7e5a1", SecondaryColor: "#173f5f" }, stops: [colorStop("#123857", 0), colorStop("#1f6a75", 0.42), colorStop("#b7c986", 0.58), colorStop("#f2f0cf", 1)] }),
  makeFieldGenerator({ id: "continent", name: "大陆", description: "大尺度陆海分布图", mode: "continent", defaults: { Scale: 2.6, Density: 0.7, PrimaryColor: "#9dbb70", SecondaryColor: "#102e4d" }, stops: [colorStop("#102e4d", 0), colorStop("#1e5870", 0.44), colorStop("#78965d", 0.52), colorStop("#d5c58c", 1)] }),
  makeFieldGenerator({ id: "mountains", name: "山脉", description: "脊状 FBM 山脉高度图", mode: "mountain", defaults: { Scale: 8.5, Contrast: 1.6, PrimaryColor: "#f1f1e8", SecondaryColor: "#303642" }, stops: [colorStop("#20242d", 0), colorStop("#68707c", 0.55), colorStop("#f4f5ed", 1)] }),
  makeFieldGenerator({ id: "canyon", name: "峡谷", description: "侵蚀沟壑与断层纹理", mode: "canyon", defaults: { Scale: 7, PrimaryColor: "#d17b3d", SecondaryColor: "#2b1510" }, stops: [colorStop("#24110e", 0), colorStop("#8f4424", 0.48), colorStop("#e3a164", 1)] }),
  makeFieldGenerator({ id: "map-river", name: "河流", description: "蜿蜒河道地图 mask", mode: "river", defaults: { Scale: 5, PrimaryColor: "#5cc9ff", SecondaryColor: "#102128" }, stops: [colorStop("#0d171e", 0), colorStop("#1d4c68", 0.55), colorStop("#9beaff", 1)] }),
  makeFieldGenerator({ id: "map-lake", name: "湖泊", description: "多湖泊水域分布", mode: "lake", defaults: { Scale: 5.5, PrimaryColor: "#6ed8ff", SecondaryColor: "#0e2230" }, stops: [colorStop("#0b1b23", 0), colorStop("#236987", 0.62), colorStop("#b8f3ff", 1)] }),
  makeFieldGenerator({ id: "volcano", name: "火山", description: "火山口、熔岩中心与灰岩坡面", mode: "volcano", defaults: { Scale: 7, PrimaryColor: "#ff6a18", SecondaryColor: "#1b1715" }, stops: [colorStop("#171616", 0), colorStop("#4a3c35", 0.45), colorStop("#f25013", 0.78), colorStop("#ffe37c", 1)] }),
  makeFieldGenerator({ id: "biome-map", name: "生物群系图", description: "离散化生态分区图", mode: "biome", defaults: { Scale: 4, Contrast: 1, PrimaryColor: "#a5d76e", SecondaryColor: "#233050" }, stops: [colorStop("#31517a", 0), colorStop("#d8c376", 0.25), colorStop("#5ba65b", 0.5), colorStop("#395b35", 0.75), colorStop("#f4f4ef", 1)] }),
  makeFieldGenerator({ id: "resource-map", name: "资源分布图", description: "可用于矿物/采集点分布的热点图", mode: "resource", defaults: { Scale: 11, PrimaryColor: "#ffd55c", SecondaryColor: "#1d1d24" }, stops: [colorStop("#101218", 0), colorStop("#33565e", 0.45), colorStop("#ffd45e", 0.82), colorStop("#fff5cc", 1)] }),

  makeFieldGenerator({ id: "grass", name: "草地", description: "细碎草叶与色块噪声", mode: "grass", defaults: { Scale: 12, PrimaryColor: "#74c95a", SecondaryColor: "#1d351f" }, stops: [colorStop("#1d351f", 0), colorStop("#3e7d37", 0.55), colorStop("#a5df75", 1)] }),
  makeFieldGenerator({ id: "dirt", name: "泥土", description: "颗粒泥土材质", mode: "default", defaults: { Scale: 16, PrimaryColor: "#8a5a33", SecondaryColor: "#2b1b12" }, stops: [colorStop("#25160e", 0), colorStop("#684224", 0.58), colorStop("#a97843", 1)] }),
  makeFieldGenerator({ id: "sand", name: "沙地", description: "风纹沙丘材质", mode: "sand", defaults: { Scale: 9, PrimaryColor: "#e8cb84", SecondaryColor: "#8a6f3c" }, stops: [colorStop("#8d743f", 0), colorStop("#d1b66f", 0.58), colorStop("#f8e6ad", 1)] }),
  makeFieldGenerator({ id: "snow-ground", name: "雪地", description: "压痕和颗粒感雪面", mode: "snowfall", defaults: { Scale: 10, PrimaryColor: "#ffffff", SecondaryColor: "#6e8faa" }, stops: [colorStop("#5c7892", 0), colorStop("#d8eef7", 0.65), colorStop("#ffffff", 1)] }),
  makeFieldGenerator({ id: "rock", name: "岩石", description: "Voronoi 裂隙岩石纹理", mode: "rock", defaults: { Scale: 13, PrimaryColor: "#a0a59f", SecondaryColor: "#24272b" }, stops: [colorStop("#1e2024", 0), colorStop("#626865", 0.56), colorStop("#b9bdb5", 1)] }),
  makeFieldGenerator({ id: "swamp", name: "沼泽", description: "泥水混合与绿色水泡", mode: "swamp", defaults: { Scale: 8, PrimaryColor: "#79a945", SecondaryColor: "#182212" }, stops: [colorStop("#11190d", 0), colorStop("#394d25", 0.5), colorStop("#8fba55", 1)] }),
  makeFieldGenerator({ id: "lava", name: "熔岩", description: "裂隙状高温熔岩地表", mode: "lava", defaults: { Scale: 14, PrimaryColor: "#ff5a14", SecondaryColor: "#130807" }, stops: [colorStop("#120606", 0), colorStop("#3b1a12", 0.55), colorStop("#e24512", 0.82), colorStop("#ffe264", 1)] }),
  makeFieldGenerator({ id: "poison", name: "毒液", description: "酸性液体与亮色泡斑", mode: "liquid", defaults: { Scale: 9, PrimaryColor: "#a7ff35", SecondaryColor: "#10280d" }, stops: [colorStop("#081609", 0), colorStop("#2e7c23", 0.55), colorStop("#c8ff4a", 1)] }),
  makeFieldGenerator({ id: "slime", name: "黏液", description: "粘稠高光和团块边缘", mode: "liquid", defaults: { Scale: 7, PrimaryColor: "#59f0a1", SecondaryColor: "#0b2c26" }, stops: [colorStop("#08201d", 0), colorStop("#1a805f", 0.55), colorStop("#9dffd0", 1)] }),
  makeFieldGenerator({ id: "oil", name: "油污", description: "暗色油膜和彩虹反光", mode: "oil", defaults: { Scale: 8, PrimaryColor: "#1f2430", SecondaryColor: "#050506" } }),

  makeFieldGenerator({ id: "water-puddle", name: "水洼", description: "浅水积洼和边缘高光", mode: "lake", defaults: { Scale: 8, Density: 0.65, PrimaryColor: "#8de8ff", SecondaryColor: "#0d1b20" }, stops: [colorStop("#0a171c", 0), colorStop("#276173", 0.58), colorStop("#c8fbff", 1)] }),
  makeFieldGenerator({ id: "water-river", name: "河流", description: "横向流动水纹", mode: "waves", defaults: { Scale: 7, PrimaryColor: "#58c9f7", SecondaryColor: "#0b2738" }, stops: [colorStop("#082032", 0), colorStop("#1d789c", 0.58), colorStop("#b9f4ff", 1)] }),
  makeFieldGenerator({ id: "water-lake", name: "湖泊", description: "低频平静水面", mode: "waves", defaults: { Scale: 3, Density: 0.45, PrimaryColor: "#62bde8", SecondaryColor: "#0c2a3f" }, stops: [colorStop("#082438", 0), colorStop("#26799c", 0.65), colorStop("#d5fbff", 1)] }),
  makeFieldGenerator({ id: "sea-waves", name: "海浪", description: "重复浪线和泡沫", mode: "waves", defaults: { Scale: 11, Contrast: 1.55, PrimaryColor: "#7be6ff", SecondaryColor: "#063459" }, stops: [colorStop("#042842", 0), colorStop("#1978a9", 0.58), colorStop("#e6ffff", 1)] }),
  makeFieldGenerator({ id: "whirlpool", name: "漩涡", description: "旋转水流中心", mode: "vortex", defaults: { Scale: 7, PrimaryColor: "#89efff", SecondaryColor: "#061827" }, stops: [colorStop("#061827", 0), colorStop("#1c7b9d", 0.62), colorStop("#d9fdff", 1)] }),
  makeFieldGenerator({ id: "waterfall", name: "瀑布", description: "垂直水流和泡沫条纹", mode: "waterfall", defaults: { Scale: 10, PrimaryColor: "#e7fbff", SecondaryColor: "#14506f" }, stops: [colorStop("#0d334b", 0), colorStop("#51afd3", 0.55), colorStop("#ffffff", 1)] }),
  makeFieldGenerator({ id: "liquid-metal", name: "液态金属", description: "镜面条纹金属流体", mode: "metal", defaults: { Scale: 9, PrimaryColor: "#e8f0f0", SecondaryColor: "#32383c" }, stops: [colorStop("#252b30", 0), colorStop("#8d989c", 0.52), colorStop("#f5ffff", 1)] }),

  makeFieldGenerator({ id: "storm-cloud", name: "风暴云", description: "暗涡云团与强对比边缘", mode: "storm", defaults: { Scale: 4.2, Contrast: 1.65, PrimaryColor: "#d9ecff", SecondaryColor: "#10131b" }, stops: [colorStop("#0b0d13", 0), colorStop("#2a3241", 0.46), colorStop("#697989", 0.78), colorStop("#e6f4ff", 1)] }),
  makeFieldGenerator({ id: "weather-war-fog", name: "战争迷雾", description: "遮蔽式低频雾面", mode: "fog-war", defaults: { Scale: 5.5, Density: 0.9, PrimaryColor: "#778987", SecondaryColor: "#07100f" }, stops: [colorStop("#050a0a", 0), colorStop("#263836", 0.55), colorStop("#93a29d", 1)] }),
  makeFieldGenerator({ id: "rain", name: "雨", description: "斜向雨丝 mask", mode: "rain", defaults: { Scale: 8, PrimaryColor: "#cdefff", SecondaryColor: "#08111a" }, stops: [colorStop("#06101a", 0), colorStop("#2c6178", 0.62), colorStop("#e9fbff", 1)] }),
  makeFieldGenerator({ id: "snow", name: "雪", description: "雪点与冷色雾层", mode: "snowfall", defaults: { Scale: 7, PrimaryColor: "#ffffff", SecondaryColor: "#1c2b3a" }, stops: [colorStop("#172433", 0), colorStop("#86a9c1", 0.58), colorStop("#ffffff", 1)] }),
  makeFieldGenerator({ id: "sandstorm", name: "沙尘暴", description: "横向风沙条带", mode: "sandstorm", defaults: { Scale: 8, PrimaryColor: "#f0c773", SecondaryColor: "#3b2815" }, stops: [colorStop("#301f11", 0), colorStop("#b88742", 0.62), colorStop("#ffe0a0", 1)] }),

  makeFieldGenerator({ id: "point-light", name: "点光源", description: "径向衰减光照贴图", mode: "light", defaults: { Scale: 1, Density: 1, PrimaryColor: "#ffeaa3", SecondaryColor: "#000000" } }),
  makeFieldGenerator({ id: "spotlight", name: "聚光灯", description: "锥形光束贴图", mode: "spotlight", defaults: { Scale: 1, Density: 1, PrimaryColor: "#fff1b5", SecondaryColor: "#000000" } }),
  makeFieldGenerator({ id: "torch-light", name: "火把光", description: "暖色抖动径向光", mode: "light", defaults: { Scale: 4, Distortion: 0.6, Density: 1, PrimaryColor: "#ffb24a", SecondaryColor: "#050000" } }),
  makeFieldGenerator({ id: "candle-light", name: "烛光", description: "小范围柔和暖光", mode: "light", defaults: { Scale: 2, Density: 0.72, PrimaryColor: "#ffd98a", SecondaryColor: "#050101" } }),
  makeFieldGenerator({ id: "glitch-light", name: "故障灯", description: "断续扫描式光纹", mode: "beam", defaults: { Scale: 12, Contrast: 2.1, PrimaryColor: "#71f6ff", SecondaryColor: "#020408" } }),
  makeFieldGenerator({ id: "alarm-light", name: "警报灯", description: "红色强衰减警示光", mode: "light", defaults: { Scale: 3, Contrast: 1.7, PrimaryColor: "#ff1f2f", SecondaryColor: "#070000" } }),
  makeFieldGenerator({ id: "energy-glow", name: "能量辉光", description: "高饱和径向能量光", mode: "light", defaults: { Scale: 5, Distortion: 0.45, PrimaryColor: "#5cf6ff", SecondaryColor: "#030812" } }),

  makeLightningVariant({ id: "lightning-chain", name: "闪电链", description: "多节点跳跃式闪电链", mode: "chain", branches: 8 }),
  makeLightningVariant({ id: "electric-arc", name: "电弧", description: "短距离弯曲电弧", mode: "arc", branches: 2, density: 0.42 }),
  makeLightningVariant({ id: "electric-grid", name: "电网", description: "网状放电线段", mode: "grid", branches: 10, density: 0.32 }),
  makeLightningVariant({ id: "tesla-coil", name: "特斯拉线圈放电", description: "中心向外发散放电", mode: "tesla", branches: 14, density: 0.55 }),

  makeFireVariant({ id: "campfire", name: "篝火", description: "中心上升的营火火苗", mode: "campfire", primary: "#ff9b2f", stops: extFireStops }),
  makeFireVariant({ id: "flamethrower", name: "喷火器", description: "横向喷射火焰束", mode: "flamethrower", primary: "#ff7a1a", stops: extFireStops }),
  makeFireVariant({ id: "fireball", name: "火球", description: "径向爆燃火球", mode: "fireball", primary: "#ff6a18", stops: extFireStops }),
  makeFireVariant({ id: "ice-flame", name: "冰焰", description: "蓝白冷焰", mode: "campfire", primary: "#38dfff", stops: extIceFireStops }),
  makeFireVariant({ id: "poison-flame", name: "毒焰", description: "绿黄毒性火焰", mode: "campfire", primary: "#9dff38", stops: extPoisonFireStops }),
  makeFireVariant({ id: "soul-fire", name: "灵魂火焰", description: "蓝紫灵魂火焰", mode: "campfire", primary: "#55b9ff", stops: extSoulFireStops }),
  makeFireVariant({ id: "thruster-flame", name: "推进器尾焰", description: "锥形高亮喷流", mode: "thruster", primary: "#62dfff", stops: extFireStops }),

  makeShieldVariant({ id: "hex-shield", name: "六边形护盾", description: "蜂窝格能量护盾", mode: "hex", color: "#47dcff" }),
  makeShieldVariant({ id: "force-field", name: "力场", description: "整体扭曲力场波纹", mode: "field", color: "#9a8cff", distortion: 0.5 }),
  makeShieldVariant({ id: "portal", name: "传送门", description: "旋涡状能量环", mode: "portal", color: "#b067ff", scale: 7 }),
  makeFieldGenerator({ id: "laser-beam", name: "激光束", description: "细长高能束流", mode: "beam", defaults: { Scale: 8, Contrast: 2.2, PrimaryColor: "#ff385c", SecondaryColor: "#080008" } }),
  makeFieldGenerator({ id: "particle-beam", name: "粒子束", description: "粒子化能量束", mode: "beam", defaults: { Scale: 14, Contrast: 1.8, PrimaryColor: "#76f7ff", SecondaryColor: "#020812" } }),

  makeFieldGenerator({ id: "magic-circle", name: "魔法阵", description: "环形符号与法阵线条", mode: "magic-circle", defaults: { Scale: 6, Contrast: 2, PrimaryColor: "#b68cff", SecondaryColor: "#06020d" } }),
  makeFieldGenerator({ id: "runes", name: "符文", description: "碎裂线条符文纹理", mode: "rune", defaults: { Scale: 8, Contrast: 2.4, PrimaryColor: "#7df6ff", SecondaryColor: "#02080b" } }),
  makeShieldVariant({ id: "summon-gate", name: "召唤门", description: "召唤用旋转门纹理", mode: "portal", color: "#ff74d4", scale: 8 }),
  makeFieldGenerator({ id: "corruption-zone", name: "腐化区域", description: "紫黑腐蚀地表", mode: "swamp", defaults: { Scale: 8, PrimaryColor: "#9e39d7", SecondaryColor: "#150819" }, stops: [colorStop("#0b050e", 0), colorStop("#4b1b58", 0.56), colorStop("#d04aff", 1)] }),
  makeFieldGenerator({ id: "void-rift", name: "虚空裂隙", description: "撕裂状虚空裂缝", mode: "rift", defaults: { Scale: 9, Contrast: 2, PrimaryColor: "#7a4dff", SecondaryColor: "#020106" }, stops: [colorStop("#010104", 0), colorStop("#25135f", 0.5), colorStop("#a384ff", 1)] }),

  makeFieldGenerator({ id: "rts-war-fog", name: "战争迷雾", description: "RTS 用遮蔽雾图", mode: "fog-war", defaults: { Scale: 6, Density: 1, PrimaryColor: "#6f7d77", SecondaryColor: "#020807" }, stops: [colorStop("#020807", 0), colorStop("#243330", 0.55), colorStop("#8c9993", 1)] }),
  makeFieldGenerator({ id: "territory-map", name: "势力范围图", description: "势力边界和控制区块", mode: "biome", defaults: { Scale: 5, Contrast: 1.7, PrimaryColor: "#ffcc4d", SecondaryColor: "#26304d" }, stops: [colorStop("#26304d", 0), colorStop("#3da5ff", 0.25), colorStop("#5fd35f", 0.5), colorStop("#ffcc4d", 0.75), colorStop("#ff5f5f", 1)] }),
  makeFieldGenerator({ id: "influence-map", name: "影响力地图", description: "多热点平滑影响力图", mode: "heatmap", defaults: { Scale: 8, PrimaryColor: "#ff4d5e", SecondaryColor: "#111827" }, stops: [colorStop("#111827", 0), colorStop("#1d8cff", 0.36), colorStop("#ffe45d", 0.7), colorStop("#ff3350", 1)] }),
  makeFieldGenerator({ id: "pathfinding-heatmap", name: "寻路热力图", description: "路径成本热力图", mode: "heatmap", defaults: { Scale: 12, PrimaryColor: "#ff3d3d", SecondaryColor: "#10151a" }, stops: [colorStop("#10151a", 0), colorStop("#2ba84a", 0.35), colorStop("#ffd84a", 0.68), colorStop("#ff3d3d", 1)] }),
  makeFieldGenerator({ id: "resource-density-map", name: "资源密度图", description: "资源热点密度图", mode: "resource", defaults: { Scale: 12, PrimaryColor: "#ffe66d", SecondaryColor: "#141414" } }),

  makeFieldGenerator({ id: "room-density-map", name: "房间密度图", description: "Roguelike 房间候选密度", mode: "resource", defaults: { Scale: 9, PrimaryColor: "#8cd7ff", SecondaryColor: "#11131a" } }),
  makeFieldGenerator({ id: "monster-density-map", name: "怪物密度图", description: "怪物生成密度热力图", mode: "heatmap", defaults: { Scale: 11, PrimaryColor: "#ff4a4a", SecondaryColor: "#101010" } }),
  makeFieldGenerator({ id: "chest-distribution-map", name: "宝箱分布图", description: "宝箱奖励点分布图", mode: "resource", defaults: { Scale: 14, PrimaryColor: "#ffd66b", SecondaryColor: "#17120c" } }),
  makeFieldGenerator({ id: "danger-heatmap", name: "危险度热力图", description: "危险区域强度图", mode: "heatmap", defaults: { Scale: 9, PrimaryColor: "#ff2d55", SecondaryColor: "#0d0d12" } }),
  makeFieldGenerator({ id: "boss-zone-map", name: "Boss区域图", description: "中心 Boss 区域与外围衰减", mode: "light", defaults: { Scale: 5, Contrast: 1.8, Density: 1, PrimaryColor: "#ff3d6e", SecondaryColor: "#10050a" } }),
];
