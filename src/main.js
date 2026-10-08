import kaplay from "kaplay";
import "./styles.css";
import { loadAssets } from "./assets.js";
import { previewIslandSizes } from "./config.js";
import { createGameControls, downloadCanvasImage } from "./game-controls.js";
import { fetchRepoIslandSizes } from "./github.js";
import { generateIslandWorld } from "./islands.js";
import { showStartScreen } from "./start-screen.js";
import { createWorld } from "./world.js";

const k = kaplay({
  crisp: true,
});

loadAssets(k);

let currentWorld = null;
let currentShareMetadata = null;

const controls = createGameControls({
  onReset: showStart,
  onDownload: () => downloadCanvasImage(currentShareMetadata),
});

showStart();

function showStart() {
  controls.hide();
  currentShareMetadata = null;
  replaceWorld(generateResponsiveWorld(previewIslandSizes));

  showStartScreen(async (githubUsername) => {
    const repoIslandSizes = await fetchRepoIslandSizes(githubUsername);

    currentShareMetadata = getShareMetadata(githubUsername, repoIslandSizes);
    replaceWorld(generateResponsiveWorld(repoIslandSizes));
    controls.show();
  });
}

function replaceWorld(islandWorld) {
  currentWorld?.destroy();
  currentWorld = createWorld(k, islandWorld);
}

function generateResponsiveWorld(sizesByIsland) {
  return generateIslandWorld(sizesByIsland, {
    transpose: isPortraitViewport(),
  });
}

function isPortraitViewport() {
  return globalThis.innerHeight > globalThis.innerWidth;
}

function getShareMetadata(username, repoIslandSizes) {
  const repos = Object.values(repoIslandSizes);

  return {
    username,
    repoCount: repos.length,
    totalStars: repos.reduce((sum, repo) => sum + repo.population, 0),
  };
}
