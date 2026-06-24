import { generators } from "../generators/index.js";

const generatorMap = new Map(generators.map((generator) => [generator.id, generator]));

export const categories = [
  {
    title: "地图生成",
    items: [
      { label: "地形高度图", generatorId: "terrain" },
      { label: "岛屿", generatorId: "island" },
      { label: "大陆", generatorId: "continent" },
      { label: "山脉", generatorId: "mountains" },
      { label: "峡谷", generatorId: "canyon" },
      { label: "河流", generatorId: "map-river" },
      { label: "湖泊", generatorId: "map-lake" },
      { label: "火山", generatorId: "volcano" },
      { label: "生物群系图", generatorId: "biome-map" },
      { label: "资源分布图", generatorId: "resource-map" },
    ],
  },
  {
    title: "地面材质",
    items: [
      { label: "草地", generatorId: "grass" },
      { label: "泥土", generatorId: "dirt" },
      { label: "沙地", generatorId: "sand" },
      { label: "雪地", generatorId: "snow-ground" },
      { label: "岩石", generatorId: "rock" },
      { label: "沼泽", generatorId: "swamp" },
      { label: "熔岩", generatorId: "lava" },
      { label: "毒液", generatorId: "poison" },
      { label: "黏液", generatorId: "slime" },
      { label: "油污", generatorId: "oil" },
      { label: "水洼", generatorId: "puddle" },
    ],
  },
  {
    title: "水体",
    items: [
      { label: "水洼", generatorId: "water-puddle" },
      { label: "河流", generatorId: "water-river" },
      { label: "湖泊", generatorId: "water-lake" },
      { label: "海浪", generatorId: "sea-waves" },
      { label: "漩涡", generatorId: "whirlpool" },
      { label: "瀑布", generatorId: "waterfall" },
      { label: "液态金属", generatorId: "liquid-metal" },
    ],
  },
  {
    title: "天气",
    items: [
      { label: "云层", generatorId: "cloud" },
      { label: "风暴云", generatorId: "storm-cloud" },
      { label: "雾", generatorId: "fog" },
      { label: "战争迷雾", generatorId: "weather-war-fog" },
      { label: "雨", generatorId: "rain" },
      { label: "雪", generatorId: "snow" },
      { label: "沙尘暴", generatorId: "sandstorm" },
    ],
  },
  {
    title: "光照",
    items: [
      { label: "点光源", generatorId: "point-light" },
      { label: "聚光灯", generatorId: "spotlight" },
      { label: "火把光", generatorId: "torch-light" },
      { label: "烛光", generatorId: "candle-light" },
      { label: "故障灯", generatorId: "glitch-light" },
      { label: "警报灯", generatorId: "alarm-light" },
      { label: "能量辉光", generatorId: "energy-glow" },
    ],
  },
  {
    title: "雷电",
    items: [
      { label: "闪电", generatorId: "lightning" },
      { label: "闪电链", generatorId: "lightning-chain" },
      { label: "电弧", generatorId: "electric-arc" },
      { label: "电网", generatorId: "electric-grid" },
      { label: "特斯拉线圈放电", generatorId: "tesla-coil" },
    ],
  },
  {
    title: "火焰",
    items: [
      { label: "篝火", generatorId: "campfire" },
      { label: "喷火器", generatorId: "flamethrower" },
      { label: "火球", generatorId: "fireball" },
      { label: "冰焰", generatorId: "ice-flame" },
      { label: "毒焰", generatorId: "poison-flame" },
      { label: "灵魂火焰", generatorId: "soul-fire" },
      { label: "推进器尾焰", generatorId: "thruster-flame" },
    ],
  },
  {
    title: "能量特效",
    items: [
      { label: "能量护盾", generatorId: "shield" },
      { label: "六边形护盾", generatorId: "hex-shield" },
      { label: "力场", generatorId: "force-field" },
      { label: "传送门", generatorId: "portal" },
      { label: "激光束", generatorId: "laser-beam" },
      { label: "粒子束", generatorId: "particle-beam" },
    ],
  },
  {
    title: "魔法",
    items: [
      { label: "魔法阵", generatorId: "magic-circle" },
      { label: "符文", generatorId: "runes" },
      { label: "召唤门", generatorId: "summon-gate" },
      { label: "腐化区域", generatorId: "corruption-zone" },
      { label: "虚空裂隙", generatorId: "void-rift" },
    ],
  },
  {
    title: "RTS工具",
    items: [
      { label: "战争迷雾", generatorId: "rts-war-fog" },
      { label: "势力范围图", generatorId: "territory-map" },
      { label: "影响力地图", generatorId: "influence-map" },
      { label: "寻路热力图", generatorId: "pathfinding-heatmap" },
      { label: "资源密度图", generatorId: "resource-density-map" },
    ],
  },
  {
    title: "Roguelike工具",
    items: [
      { label: "房间密度图", generatorId: "room-density-map" },
      { label: "怪物密度图", generatorId: "monster-density-map" },
      { label: "宝箱分布图", generatorId: "chest-distribution-map" },
      { label: "危险度热力图", generatorId: "danger-heatmap" },
      { label: "Boss区域图", generatorId: "boss-zone-map" },
    ],
  },
];

export function getGenerator(id) {
  return generatorMap.get(id);
}

export function getAllGenerators() {
  return generators;
}
