import { extendedGenerators } from "../ExtendedGenerators.js";

const MAP_GENERATOR_IDS = new Set([
  "island",
  "continent",
  "mountains",
  "canyon",
  "map-river",
  "map-lake",
  "volcano",
  "biome-map",
  "resource-map",
]);

export const mapGenerators = extendedGenerators.filter((generator) => MAP_GENERATOR_IDS.has(generator.id));
