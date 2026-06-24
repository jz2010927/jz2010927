const ALL_MAPS = ["color", "height", "normal", "roughness", "alpha", "emissive"];
const MATERIAL_MAPS = ["color", "height", "normal", "roughness", "alpha"];
const EMISSIVE_MAPS = ["color", "height", "normal", "roughness", "alpha", "emissive"];

const TILEABLE_IDS = new Set([
  "terrain",
  "cloud",
  "fog",
  "grass",
  "dirt",
  "sand",
  "snow-ground",
  "rock",
  "swamp",
  "lava",
  "poison",
  "slime",
  "oil",
  "water-puddle",
  "water-river",
  "water-lake",
  "sea-waves",
  "waterfall",
  "liquid-metal",
  "storm-cloud",
  "weather-war-fog",
  "rain",
  "snow",
  "sandstorm",
]);

const CORE_IDS = new Set([
  "terrain",
  "island",
  "mountains",
  "grass",
  "rock",
  "lava",
  "sea-waves",
  "cloud",
  "storm-cloud",
  "lightning-chain",
  "fireball",
  "shield",
  "hex-shield",
  "magic-circle",
  "resource-map",
  "pathfinding-heatmap",
]);

const PRESETS = {
  terrain: [
    { name: "群山", params: { Seed: "terrain-mountains", Scale: 6.8, Contrast: 1.75, Brightness: -0.08, Octaves: 7, Persistence: 0.48, Lacunarity: 2.3, Distortion: 0.18 } },
    { name: "荒漠高原", params: { Seed: "terrain-desert", Scale: 4.4, Contrast: 1.25, Brightness: 0.08, Octaves: 5, Persistence: 0.42, Lacunarity: 2.0, Distortion: 0.08 } },
    { name: "火山地貌", params: { Seed: "terrain-volcanic", Scale: 7.2, Contrast: 2.0, Brightness: -0.12, Octaves: 6, Persistence: 0.56, Lacunarity: 2.15, Distortion: 0.32 } },
  ],
  fireball: [
    { name: "爆炸核心", params: { Seed: "fireball-core", Scale: 5.8, Density: 1.15, Contrast: 2.1, Brightness: 0.12, Distortion: 0.65, Detail: 6, PrimaryColor: "#ff6a18", SecondaryColor: "#100304" } },
    { name: "法术火球", params: { Seed: "fireball-spell", Scale: 4.5, Density: 0.92, Contrast: 1.55, Brightness: 0.04, Distortion: 0.5, Detail: 5, PrimaryColor: "#ff9d2e", SecondaryColor: "#160507" } },
    { name: "低温蓝焰", params: { Seed: "fireball-cold", Scale: 5.1, Density: 0.9, Contrast: 1.7, Brightness: 0.02, Distortion: 0.58, Detail: 5, PrimaryColor: "#38dfff", SecondaryColor: "#020615" } },
    { name: "毒性火球", params: { Seed: "fireball-poison", Scale: 5.4, Density: 1.0, Contrast: 1.85, Brightness: 0.03, Distortion: 0.7, Detail: 6, PrimaryColor: "#9dff38", SecondaryColor: "#071207" } },
  ],
  shield: [
    { name: "薄膜护盾", params: { Seed: "shield-film", Scale: 9, Distortion: 0.18, Density: 0.45, GlowStrength: 0.55, AnimationSpeed: 0, PrimaryColor: "#79e8ff" } },
    { name: "厚能量罩", params: { Seed: "shield-heavy", Scale: 7, Distortion: 0.36, Density: 0.85, GlowStrength: 1.15, AnimationSpeed: 0, PrimaryColor: "#41d6ff" } },
    { name: "紫色力场", params: { Seed: "shield-violet", Scale: 11, Distortion: 0.42, Density: 0.72, GlowStrength: 0.95, AnimationSpeed: 0, PrimaryColor: "#a684ff" } },
  ],
  "hex-shield": [
    { name: "细六边格", params: { Seed: "hex-fine", Scale: 15, Density: 0.58, Contrast: 1.4, Brightness: -0.04, Distortion: 0.14, Detail: 4, PrimaryColor: "#47dcff", SecondaryColor: "#030810" } },
    { name: "厚六边格", params: { Seed: "hex-heavy", Scale: 9, Density: 1.05, Contrast: 1.7, Brightness: 0.02, Distortion: 0.28, Detail: 5, PrimaryColor: "#59f2d6", SecondaryColor: "#020807" } },
    { name: "受击闪光", params: { Seed: "hex-impact", Scale: 12, Density: 1.2, Contrast: 2.1, Brightness: 0.1, Distortion: 0.45, Detail: 6, PrimaryColor: "#ffffff", SecondaryColor: "#062c44" } },
  ],
  grass: [
    { name: "短草", params: { Seed: "grass-short", Scale: 15, Density: 0.65, Contrast: 1.25, Brightness: 0.02, Distortion: 0.12, Detail: 5, PrimaryColor: "#74c95a", SecondaryColor: "#1d351f" } },
    { name: "湿草", params: { Seed: "grass-wet", Scale: 10, Density: 0.82, Contrast: 1.35, Brightness: -0.03, Distortion: 0.25, Detail: 6, PrimaryColor: "#49b46a", SecondaryColor: "#102a24" } },
    { name: "枯草", params: { Seed: "grass-dry", Scale: 13, Density: 0.62, Contrast: 1.15, Brightness: 0.05, Distortion: 0.16, Detail: 5, PrimaryColor: "#c2b45e", SecondaryColor: "#463d1e" } },
  ],
  rock: [
    { name: "裂隙岩", params: { Seed: "rock-crack", Scale: 16, Density: 0.9, Contrast: 1.75, Brightness: -0.08, Distortion: 0.18, Detail: 5, PrimaryColor: "#a0a59f", SecondaryColor: "#24272b" } },
    { name: "玄武岩", params: { Seed: "rock-basalt", Scale: 12, Density: 0.8, Contrast: 1.45, Brightness: -0.16, Distortion: 0.12, Detail: 5, PrimaryColor: "#5d6366", SecondaryColor: "#111315" } },
    { name: "浅色石板", params: { Seed: "rock-slab", Scale: 10, Density: 0.68, Contrast: 1.25, Brightness: 0.08, Distortion: 0.1, Detail: 4, PrimaryColor: "#c7c3b5", SecondaryColor: "#55584f" } },
  ],
  lava: [
    { name: "裂缝熔岩", params: { Seed: "lava-cracks", Scale: 15, Density: 0.95, Contrast: 1.9, Brightness: -0.02, Distortion: 0.22, Detail: 5, PrimaryColor: "#ff5a14", SecondaryColor: "#130807" } },
    { name: "熔岩河", params: { Seed: "lava-river", Scale: 8, Density: 1.05, Contrast: 1.65, Brightness: 0.05, Distortion: 0.5, Detail: 6, PrimaryColor: "#ff8a21", SecondaryColor: "#1c0704" } },
    { name: "冷却熔岩", params: { Seed: "lava-cooling", Scale: 18, Density: 0.65, Contrast: 1.45, Brightness: -0.12, Distortion: 0.16, Detail: 5, PrimaryColor: "#d94916", SecondaryColor: "#171717" } },
  ],
  "sea-waves": [
    { name: "细浪", params: { Seed: "waves-small", Scale: 13, Density: 0.55, Contrast: 1.35, Brightness: 0.02, Distortion: 0.18, Detail: 5, PrimaryColor: "#7be6ff", SecondaryColor: "#063459" } },
    { name: "大浪", params: { Seed: "waves-large", Scale: 7, Density: 0.82, Contrast: 1.65, Brightness: 0, Distortion: 0.38, Detail: 6, PrimaryColor: "#98f1ff", SecondaryColor: "#042842" } },
    { name: "泡沫海面", params: { Seed: "waves-foam", Scale: 16, Density: 1.05, Contrast: 1.9, Brightness: 0.08, Distortion: 0.32, Detail: 6, PrimaryColor: "#e6ffff", SecondaryColor: "#1978a9" } },
  ],
};

const SEMANTIC_LABELS = {
  fireball: {
    Scale: "核心半径",
    Density: "爆裂强度",
    Distortion: "火焰羽化",
    Detail: "火舌细节",
    Contrast: "核心对比",
  },
  "sea-waves": {
    Scale: "浪宽",
    Density: "泡沫量",
    Distortion: "流向扰动",
    Detail: "浪面细节",
    Contrast: "浪峰对比",
  },
  "water-river": {
    Scale: "流纹宽度",
    Density: "水纹强度",
    Distortion: "流向扰动",
    Detail: "流动细节",
  },
  "magic-circle": {
    Scale: "法阵尺度",
    Density: "符文密度",
    Distortion: "能量扰动",
    Detail: "线条细节",
    Contrast: "线条强度",
  },
  "resource-map": {
    Scale: "热点数量",
    Density: "资源密度",
    Distortion: "扩散扰动",
    Detail: "分布细节",
  },
  "resource-density-map": {
    Scale: "热点数量",
    Density: "资源密度",
    Distortion: "扩散半径",
    Detail: "稀疏度",
  },
  "pathfinding-heatmap": {
    Scale: "网格复杂度",
    Density: "成本强度",
    Distortion: "路径扰动",
    Detail: "成本细节",
  },
  shield: {
    Scale: "单元尺度",
    Density: "护盾密度",
    Distortion: "表面扰动",
    GlowStrength: "辉光强度",
  },
  "hex-shield": {
    Scale: "六边格尺寸",
    Density: "网格强度",
    Distortion: "护盾扰动",
    Detail: "能量细节",
  },
  grass: {
    Scale: "草叶密度",
    Density: "覆盖强度",
    Distortion: "生长扰动",
    Detail: "草叶细节",
  },
  rock: {
    Scale: "裂隙尺寸",
    Density: "裂隙强度",
    Distortion: "断层扰动",
    Detail: "岩面细节",
  },
  lava: {
    Scale: "裂缝密度",
    Density: "熔岩亮度",
    Distortion: "流动扰动",
    Detail: "热纹细节",
  },
};

function supportedMapsFor(generator) {
  if (/fire|flame|lava|lightning|electric|tesla|shield|field|portal|laser|beam|magic|rune|rift|glow|light|volcano/.test(generator.id)) {
    return EMISSIVE_MAPS;
  }
  if (/grass|dirt|sand|snow|rock|swamp|poison|slime|oil|water|waves|cloud|fog|terrain|mountain|island|continent|canyon|lake/.test(generator.id)) {
    return MATERIAL_MAPS;
  }
  return ALL_MAPS;
}

export function decorateGenerator(generator) {
  const presets = PRESETS[generator.id] || [];
  const labels = SEMANTIC_LABELS[generator.id] || {};
  return {
    ...generator,
    getParamSchema() {
      const schema = generator.getParamSchema();
      return schema.map((field) => ({ ...field, label: labels[field.key] || field.label }));
    },
    getMeta() {
      return {
        qualityTier: CORE_IDS.has(generator.id) ? "核心精修" : "基础质量",
        supportsTileable: TILEABLE_IDS.has(generator.id),
        supportedMaps: supportedMapsFor(generator),
        presetGroups: presets.length ? ["内置预设"] : [],
      };
    },
    getPresets() {
      return presets;
    },
  };
}
