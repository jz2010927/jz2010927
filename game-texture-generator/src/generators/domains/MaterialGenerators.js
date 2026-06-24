import { extendedGenerators } from "../ExtendedGenerators.js";

const MATERIAL_GENERATOR_IDS = new Set([
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
]);

export const materialGenerators = extendedGenerators.filter((generator) => MATERIAL_GENERATOR_IDS.has(generator.id));
