import kaplay from "kaplay";
import { loadAssets } from "./assets.js";
import { generateIslandWorld } from "./islands.js";
import { createWorld } from "./world.js";

const k = kaplay({
  crisp: true,
});

loadAssets(k);
createWorld(k, generateIslandWorld());
