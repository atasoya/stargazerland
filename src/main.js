import kaplay from "kaplay";
import { loadAssets } from "./assets.js";
import { generateIslandMap } from "./islands.js";
import { createWorld } from "./world.js";

const k = kaplay({
  crisp: true,
});

loadAssets(k);
createWorld(k, generateIslandMap());
