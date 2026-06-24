import { extendedGenerators } from "../ExtendedGenerators.js";

const WATER_GENERATOR_IDS = new Set([
  "water-puddle",
  "water-river",
  "water-lake",
  "sea-waves",
  "whirlpool",
  "waterfall",
  "liquid-metal",
]);

export const waterGenerators = extendedGenerators.filter((generator) => WATER_GENERATOR_IDS.has(generator.id));
