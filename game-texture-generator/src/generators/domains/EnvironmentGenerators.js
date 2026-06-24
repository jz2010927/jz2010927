import { extendedGenerators } from "../ExtendedGenerators.js";

const ENVIRONMENT_GENERATOR_IDS = new Set([
  "storm-cloud",
  "weather-war-fog",
  "rain",
  "snow",
  "sandstorm",
  "point-light",
  "spotlight",
  "torch-light",
  "candle-light",
  "glitch-light",
  "alarm-light",
  "energy-glow",
]);

export const environmentGenerators = extendedGenerators.filter((generator) => ENVIRONMENT_GENERATOR_IDS.has(generator.id));
