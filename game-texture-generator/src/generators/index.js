import { CloudGenerator } from "./CloudGenerator.js";
import { environmentGenerators } from "./domains/EnvironmentGenerators.js";
import { mapGenerators } from "./domains/MapGenerators.js";
import { materialGenerators } from "./domains/MaterialGenerators.js";
import { toolMapGenerators } from "./domains/ToolMapGenerators.js";
import { vfxGenerators } from "./domains/VfxGenerators.js";
import { waterGenerators } from "./domains/WaterGenerators.js";
import { FireGenerator } from "./FireGenerator.js";
import { FogGenerator } from "./FogGenerator.js";
import { decorateGenerator } from "./GeneratorMetadata.js";
import { LightningGenerator } from "./LightningGenerator.js";
import { PuddleGenerator } from "./PuddleGenerator.js";
import { ShieldGenerator } from "./ShieldGenerator.js";
import { TerrainGenerator } from "./TerrainGenerator.js";

export const generators = [
  TerrainGenerator,
  CloudGenerator,
  FogGenerator,
  LightningGenerator,
  PuddleGenerator,
  FireGenerator,
  ShieldGenerator,
  ...mapGenerators,
  ...materialGenerators,
  ...waterGenerators,
  ...environmentGenerators,
  ...vfxGenerators,
  ...toolMapGenerators,
].map(decorateGenerator);
