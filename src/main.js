import kaplay from "kaplay";
import "./styles.css";
import { loadAssets } from "./assets.js";
import { previewIslandSizes } from "./config.js";
import { fetchRepoIslandSizes } from "./github.js";
import { generateIslandWorld } from "./islands.js";
import { showStartScreen } from "./start-screen.js";
import { createWorld } from "./world.js";

const k = kaplay({
  crisp: true,
});

loadAssets(k);

const previewWorld = createWorld(k, generateIslandWorld(previewIslandSizes));

showStartScreen(async (githubUsername) => {
  const repoIslandSizes = await fetchRepoIslandSizes(githubUsername);

  previewWorld.destroy();
  createWorld(k, generateIslandWorld(repoIslandSizes));
});
