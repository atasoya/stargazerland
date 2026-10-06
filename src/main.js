import kaplay from "kaplay";
import "./styles.css";
import { loadAssets } from "./assets.js";
import { previewIslandSizes } from "./config.js";
import { createGameControls, shareCanvasImage } from "./game-controls.js";
import { fetchRepoIslandSizes } from "./github.js";
import { generateIslandWorld } from "./islands.js";
import { showStartScreen } from "./start-screen.js";
import { createWorld } from "./world.js";

const k = kaplay({
  crisp: true,
});

loadAssets(k);

let currentWorld = null;

const controls = createGameControls({
  onReset: showStart,
  onShare: shareCanvasImage,
});

showStart();

function showStart() {
  controls.hide();
  replaceWorld(generateIslandWorld(previewIslandSizes));

  showStartScreen(async (githubUsername) => {
    const repoIslandSizes = await fetchRepoIslandSizes(githubUsername);

    replaceWorld(generateIslandWorld(repoIslandSizes));
    controls.show();
  });
}

function replaceWorld(islandWorld) {
  currentWorld?.destroy();
  currentWorld = createWorld(k, islandWorld);
}
