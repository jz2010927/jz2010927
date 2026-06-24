import { extendedGenerators } from "../ExtendedGenerators.js";

const TOOL_MAP_GENERATOR_IDS = new Set([
  "rts-war-fog",
  "territory-map",
  "influence-map",
  "pathfinding-heatmap",
  "resource-density-map",
  "room-density-map",
  "monster-density-map",
  "chest-distribution-map",
  "danger-heatmap",
  "boss-zone-map",
]);

export const toolMapGenerators = extendedGenerators.filter((generator) => TOOL_MAP_GENERATOR_IDS.has(generator.id));
