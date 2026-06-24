const STORAGE_KEY = "gtl-itch-language";

const UI_TEXT = {
  en: {
    "aria.sidebar": "Texture categories",
    "aria.preview": "Preview",
    "aria.params": "Parameters",
    generate: "Generate / Refresh",
    randomize: "Randomize",
    preset: "Preset",
    defaultPreset: "Default",
    format: "Format",
    width: "Width",
    height: "Height",
    backgroundColor: "Background",
    transparentNoise: "Transparent noise",
    mapType: "Map type",
    tileable: "Tileable",
    exportCurrent: "Export Current Map",
    exportPack: "Export Texture Pack",
    language: "Language",
    zoomDefault: "100%",
    metaCore: "Core",
    metaBase: "Basic",
    metaTileable: "Tileable",
    metaNotTileable: "Not tileable",
    "status.initial": "Adjust parameters, then click Generate",
    "status.pending": "Pending generation",
    "status.clickGenerate": "Click Generate / Refresh",
    "status.generating": "Generating...",
    "status.generated": "Generated",
    "status.mapSwitched": "Map type switched",
    "status.exporting": "Exporting...",
    "status.exported": "Exported",
    "status.exportingPack": "Exporting texture pack...",
    "status.packExported": "Texture pack exported",
    "status.packFailed": "Texture pack export failed",
    "status.workerFallback": "Worker unavailable, generated on main thread",
    "status.workerExportFallback": "Worker export failed, exported on main thread",
    "status.exportingMap": "Exporting {current}/{total}: {mapType}",
    "map.color": "Color",
    "map.height": "Height Map",
    "map.normal": "Normal Map",
    "map.roughness": "Roughness",
    "map.alpha": "Alpha Mask",
    "map.emissive": "Emissive Map",
  },
  zh: {
    "aria.sidebar": "纹理类别",
    "aria.preview": "实时预览",
    "aria.params": "参数控制",
    generate: "生成 / 刷新",
    randomize: "随机参数",
    preset: "预设",
    defaultPreset: "默认",
    format: "格式",
    width: "宽",
    height: "高",
    backgroundColor: "背景颜色",
    transparentNoise: "透明噪声",
    mapType: "贴图类型",
    tileable: "无缝平铺",
    exportCurrent: "导出当前贴图",
    exportPack: "导出贴图包",
    language: "语言",
    zoomDefault: "100%",
    metaCore: "核心精修",
    metaBase: "基础质量",
    metaTileable: "支持平铺",
    metaNotTileable: "非平铺",
    "status.initial": "修改参数后点击生成",
    "status.pending": "待生成",
    "status.clickGenerate": "点击生成 / 刷新",
    "status.generating": "生成中...",
    "status.generated": "已生成",
    "status.mapSwitched": "已切换贴图类型",
    "status.exporting": "导出中...",
    "status.exported": "已导出",
    "status.exportingPack": "导出贴图包...",
    "status.packExported": "贴图包已导出",
    "status.packFailed": "贴图包导出失败",
    "status.workerFallback": "Worker 不可用，已使用主线程生成",
    "status.workerExportFallback": "Worker 导出失败，已使用主线程导出",
    "status.exportingMap": "导出中 {current}/{total}: {mapType}",
    "map.color": "Color",
    "map.height": "Height Map",
    "map.normal": "Normal Map",
    "map.roughness": "Roughness",
    "map.alpha": "Alpha Mask",
    "map.emissive": "Emissive Map",
  },
};

const CATEGORY_NAMES = {
  en: {
    地图生成: "Map Generation",
    地面材质: "Ground Materials",
    水体: "Water",
    天气: "Weather",
    光照: "Lighting",
    雷电: "Electricity",
    火焰: "Fire",
    能量特效: "Energy VFX",
    魔法: "Magic",
    RTS工具: "RTS Tools",
    Roguelike工具: "Roguelike Tools",
  },
};

const GENERATOR_NAMES = {
  en: {
    "terrain": "Terrain Height Map",
    island: "Island",
    continent: "Continent",
    mountains: "Mountains",
    canyon: "Canyon",
    "map-river": "Map River",
    "map-lake": "Map Lake",
    volcano: "Volcano",
    "biome-map": "Biome Map",
    "resource-map": "Resource Distribution",
    grass: "Grass",
    dirt: "Dirt",
    sand: "Sand",
    "snow-ground": "Snow Ground",
    rock: "Rock",
    swamp: "Swamp",
    lava: "Lava",
    poison: "Poison",
    slime: "Slime",
    oil: "Oil Spill",
    puddle: "Puddle",
    "water-puddle": "Water Puddle",
    "water-river": "River Water",
    "water-lake": "Lake Water",
    "sea-waves": "Sea Waves",
    whirlpool: "Whirlpool",
    waterfall: "Waterfall",
    "liquid-metal": "Liquid Metal",
    cloud: "Clouds",
    "storm-cloud": "Storm Clouds",
    fog: "Fog",
    "weather-war-fog": "War Fog",
    rain: "Rain",
    snow: "Snow",
    sandstorm: "Sandstorm",
    "point-light": "Point Light",
    spotlight: "Spotlight",
    "torch-light": "Torch Light",
    "candle-light": "Candle Light",
    "glitch-light": "Glitch Light",
    "alarm-light": "Alarm Light",
    "energy-glow": "Energy Glow",
    lightning: "Lightning",
    "lightning-chain": "Lightning Chain",
    "electric-arc": "Electric Arc",
    "electric-grid": "Electric Grid",
    "tesla-coil": "Tesla Coil Discharge",
    campfire: "Campfire",
    flamethrower: "Flamethrower",
    fireball: "Fireball",
    "ice-flame": "Ice Flame",
    "poison-flame": "Poison Flame",
    "soul-fire": "Soul Fire",
    "thruster-flame": "Thruster Flame",
    shield: "Energy Shield",
    "hex-shield": "Hex Shield",
    "force-field": "Force Field",
    portal: "Portal",
    "laser-beam": "Laser Beam",
    "particle-beam": "Particle Beam",
    "magic-circle": "Magic Circle",
    runes: "Runes",
    "summon-gate": "Summon Gate",
    "corruption-zone": "Corruption Zone",
    "void-rift": "Void Rift",
    "rts-war-fog": "RTS War Fog",
    "territory-map": "Territory Map",
    "influence-map": "Influence Map",
    "pathfinding-heatmap": "Pathfinding Heatmap",
    "resource-density-map": "Resource Density Map",
    "room-density-map": "Room Density Map",
    "monster-density-map": "Monster Density Map",
    "chest-distribution-map": "Chest Distribution Map",
    "danger-heatmap": "Danger Heatmap",
    "boss-zone-map": "Boss Zone Map",
  },
};

const GENERATOR_DESCRIPTIONS = {
  en: {
    terrain: "FBM elevation map with terrain color bands",
    cloud: "Layered FBM cloud texture",
    fog: "Low-frequency fog and veil noise",
    lightning: "Fractal bolt, branches, and glow",
    puddle: "Voronoi wet edges and highlights",
    fire: "Vertical flowing flame gradient",
    shield: "Energy shield ring, glow, and distortion",
  },
};

const PARAM_LABELS = {
  en: {
    Seed: "Seed",
    Scale: "Scale",
    "Cell Scale": "Cell Scale",
    Contrast: "Contrast",
    Brightness: "Brightness",
    Octaves: "Octaves",
    Persistence: "Persistence",
    Lacunarity: "Lacunarity",
    Distortion: "Distortion",
    AnimationSpeed: "Animation Speed",
    "Animation Speed": "Animation Speed",
    GlowStrength: "Glow Strength",
    "Glow Strength": "Glow Strength",
    BranchCount: "Branch Count",
    "Branch Count": "Branch Count",
    Density: "Density",
    Smoothness: "Smoothness",
    BlurAmount: "Blur Amount",
    Detail: "Detail",
    PrimaryColor: "Primary Color",
    "Primary Color": "Primary Color",
    SecondaryColor: "Secondary Color",
    "Secondary Color": "Secondary Color",
    随机种子: "Seed",
    尺度: "Scale",
    单元尺度: "Cell Scale",
    对比度: "Contrast",
    亮度: "Brightness",
    噪声层数: "Octaves",
    持续度: "Persistence",
    频率增幅: "Lacunarity",
    扭曲强度: "Distortion",
    动画速度: "Animation Speed",
    辉光强度: "Glow Strength",
    分支数量: "Branch Count",
    密度: "Density",
    平滑度: "Smoothness",
    模糊强度: "Blur Amount",
    细节层级: "Detail",
    主颜色: "Primary Color",
    副颜色: "Secondary Color",
    核心半径: "Core Radius",
    爆裂强度: "Burst Strength",
    火焰羽化: "Flame Feathering",
    火舌细节: "Flame Detail",
    核心对比: "Core Contrast",
    浪宽: "Wave Width",
    泡沫量: "Foam Amount",
    流向扰动: "Flow Distortion",
    浪面细节: "Wave Detail",
    浪峰对比: "Crest Contrast",
    流纹宽度: "Flow Streak Width",
    水纹强度: "Ripple Strength",
    流动细节: "Flow Detail",
    法阵尺度: "Circle Scale",
    符文密度: "Rune Density",
    能量扰动: "Energy Distortion",
    线条细节: "Line Detail",
    线条强度: "Line Strength",
    热点数量: "Hotspot Count",
    资源密度: "Resource Density",
    扩散扰动: "Spread Distortion",
    分布细节: "Distribution Detail",
    扩散半径: "Spread Radius",
    稀疏度: "Sparsity",
    网格复杂度: "Grid Complexity",
    成本强度: "Cost Strength",
    路径扰动: "Path Distortion",
    成本细节: "Cost Detail",
    护盾密度: "Shield Density",
    表面扰动: "Surface Distortion",
    六边格尺寸: "Hex Cell Size",
    网格强度: "Grid Strength",
    护盾扰动: "Shield Distortion",
    能量细节: "Energy Detail",
    草叶密度: "Blade Density",
    覆盖强度: "Coverage",
    生长扰动: "Growth Distortion",
    草叶细节: "Blade Detail",
    裂隙尺寸: "Crack Size",
    裂隙强度: "Crack Strength",
    断层扰动: "Fault Distortion",
    岩面细节: "Rock Detail",
    裂缝密度: "Crack Density",
    熔岩亮度: "Lava Brightness",
    流动扰动: "Flow Distortion",
    热纹细节: "Heat Detail",
  },
  zh: {
    Seed: "随机种子",
    Scale: "尺度",
    "Cell Scale": "单元尺度",
    Contrast: "对比度",
    Brightness: "亮度",
    Octaves: "噪声层数",
    Persistence: "持续度",
    Lacunarity: "频率增幅",
    Distortion: "扭曲强度",
    AnimationSpeed: "动画速度",
    "Animation Speed": "动画速度",
    GlowStrength: "辉光强度",
    "Glow Strength": "辉光强度",
    BranchCount: "分支数量",
    "Branch Count": "分支数量",
    Density: "密度",
    Smoothness: "平滑度",
    BlurAmount: "模糊强度",
    Detail: "细节层级",
    PrimaryColor: "主颜色",
    "Primary Color": "主颜色",
    SecondaryColor: "副颜色",
    "Secondary Color": "副颜色",
  },
};

const PRESET_NAMES = {
  en: {
    群山: "Mountains",
    荒漠高原: "Desert Plateau",
    火山地貌: "Volcanic Terrain",
    爆炸核心: "Explosive Core",
    法术火球: "Spell Fireball",
    低温蓝焰: "Cold Blue Flame",
    毒性火球: "Toxic Fireball",
    薄膜护盾: "Thin Film Shield",
    厚能量罩: "Heavy Energy Dome",
    紫色力场: "Violet Force Field",
    细六边格: "Fine Hex Grid",
    厚六边格: "Heavy Hex Grid",
    受击闪光: "Impact Flash",
    短草: "Short Grass",
    湿草: "Wet Grass",
    枯草: "Dry Grass",
    裂隙岩: "Cracked Rock",
    玄武岩: "Basalt",
    浅色石板: "Light Stone Slab",
    裂缝熔岩: "Cracked Lava",
    熔岩河: "Lava River",
    冷却熔岩: "Cooling Lava",
    细浪: "Small Waves",
    大浪: "Large Waves",
    泡沫海面: "Foamy Sea",
  },
};

let currentLanguage = "en";

export function getLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) || currentLanguage;
  } catch {
    return currentLanguage;
  }
}

export function setLanguage(language) {
  currentLanguage = language === "zh" ? "zh" : "en";
  try {
    localStorage.setItem(STORAGE_KEY, currentLanguage);
  } catch {
    // localStorage can be unavailable in restricted iframes.
  }
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
}

export function t(key, values = {}) {
  const language = getLanguage();
  const text = UI_TEXT[language]?.[key] || UI_TEXT.en[key] || key;
  return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
}

export function translateCategoryTitle(title) {
  return getLanguage() === "en" ? CATEGORY_NAMES.en[title] || title : title;
}

export function translateGeneratorName(generatorOrId, fallback = "") {
  const id = typeof generatorOrId === "string" ? generatorOrId : generatorOrId.id;
  if (getLanguage() === "en") return GENERATOR_NAMES.en[id] || fallback || id;
  return fallback || generatorOrId.name || id;
}

export function translateGeneratorDescription(generator) {
  if (getLanguage() === "zh") return generator.description;
  return GENERATOR_DESCRIPTIONS.en[generator.id] || `${translateGeneratorName(generator)} procedural texture`;
}

export function translateParamLabel(field) {
  const language = getLanguage();
  return PARAM_LABELS[language]?.[field.label] || PARAM_LABELS[language]?.[field.key] || field.label || field.key;
}

export function translatePresetName(name) {
  return getLanguage() === "en" ? PRESET_NAMES.en[name] || name : name;
}

export function translateMeta(meta = {}) {
  const quality = meta.qualityTier === "核心精修" ? t("metaCore") : t("metaBase");
  const tileable = meta.supportsTileable ? t("metaTileable") : t("metaNotTileable");
  return `${quality} / ${tileable}`;
}

export function translateMapType(mapType) {
  return t(`map.${mapType}`);
}
