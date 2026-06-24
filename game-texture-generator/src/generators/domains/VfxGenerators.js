import { extendedGenerators } from "../ExtendedGenerators.js";

const VFX_GENERATOR_IDS = new Set([
  "lightning-chain",
  "electric-arc",
  "electric-grid",
  "tesla-coil",
  "campfire",
  "flamethrower",
  "fireball",
  "ice-flame",
  "poison-flame",
  "soul-fire",
  "thruster-flame",
  "hex-shield",
  "force-field",
  "portal",
  "laser-beam",
  "particle-beam",
  "magic-circle",
  "runes",
  "summon-gate",
  "corruption-zone",
  "void-rift",
]);

export const vfxGenerators = extendedGenerators.filter((generator) => VFX_GENERATOR_IDS.has(generator.id));
