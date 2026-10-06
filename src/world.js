import {
  BASE_SCALE,
  MAP_COLS,
  MAP_PADDING,
  MAP_ROWS,
  MIN_RENDER_SCALE,
  TILE_SIZE,
} from "./config.js";
import { getGrassFrame } from "./grass.js";
import { findFirstLandTile } from "./islands.js";
import { createPopulation, resizePopulation } from "./population.js";

export function createWorld(k, islandWorld) {
  const islandMap = Array.isArray(islandWorld) ? islandWorld : islandWorld.map;
  const islands = Array.isArray(islandWorld) ? [] : islandWorld.islands;
  const waterTiles = [];
  const grassTiles = [];
  const layout = createLayout(k);
  let mapX = Math.round((k.width() - layout.mapWidth) / 2);
  let mapY = Math.round((k.height() - layout.mapHeight) / 2);

  const isLand = (col, row) => islandMap[row]?.[col] === "#";
  const getTilePos = (col, row) => ({
    x: mapX + col * layout.cellSize,
    y: mapY + row * layout.cellSize,
  });

  for (let row = 0; row < islandMap.length; row++) {
    for (let col = 0; col < islandMap[row].length; col++) {
      if (!isLand(col, row)) continue;

      const position = getTilePos(col, row);

      const tile = k.add([
        k.pos(position.x, position.y),
        k.sprite("grass", {
          frame: getGrassFrame(isLand, col, row),
        }),
        k.scale(layout.renderScale),
        k.z(-5),
      ]);

      grassTiles.push({ tile, col, row });
    }
  }

  const playerStart = findFirstLandTile(islandMap);
  const playerPosition = getTilePos(playerStart.col, playerStart.row);
  const player = k.add([
    k.pos(playerPosition.x, playerPosition.y),
    k.sprite("character"),
    k.scale(2),
    k.z(1),
  ]);

  player.play("idleFront");

  const people = createPopulation(k, islands, layout, getTilePos);

  function rebuildWater() {
    while (waterTiles.length > 0) {
      waterTiles.pop().destroy();
    }

    const cols = Math.ceil(k.width() / layout.cellSize) + 1;
    const rows = Math.ceil(k.height() / layout.cellSize) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const waterTile = k.add([
          k.pos(col * layout.cellSize, row * layout.cellSize),
          k.sprite("water"),
          k.scale(layout.renderScale),
          k.z(-10),
        ]);

        waterTiles.push(waterTile);
      }
    }
  }

  function resizeWorld() {
    const playerCol = (player.pos.x - mapX) / layout.cellSize;
    const playerRow = (player.pos.y - mapY) / layout.cellSize;

    updateLayout(k, layout);
    rebuildWater();

    mapX = Math.round((k.width() - layout.mapWidth) / 2);
    mapY = Math.round((k.height() - layout.mapHeight) / 2);

    for (const { tile, col, row } of grassTiles) {
      const position = getTilePos(col, row);

      tile.pos.x = position.x;
      tile.pos.y = position.y;
      tile.scaleTo(layout.renderScale);
    }

    player.pos.x = mapX + playerCol * layout.cellSize;
    player.pos.y = mapY + playerRow * layout.cellSize;
    player.scaleTo(Math.max(1, (layout.renderScale / BASE_SCALE) * 2));
    resizePopulation(people, layout, getTilePos);
  }

  k.onResize(resizeWorld);
  resizeWorld();
}

function createLayout(k) {
  const layout = {
    renderScale: BASE_SCALE,
    cellSize: TILE_SIZE * BASE_SCALE,
    mapWidth: MAP_COLS * TILE_SIZE * BASE_SCALE,
    mapHeight: MAP_ROWS * TILE_SIZE * BASE_SCALE,
  };

  updateLayout(k, layout);

  return layout;
}

function updateLayout(k, layout) {
  const availableWidth = Math.max(TILE_SIZE, k.width() - MAP_PADDING * 2);
  const availableHeight = Math.max(TILE_SIZE, k.height() - MAP_PADDING * 2);
  const scaleToFit = Math.min(
    BASE_SCALE,
    availableWidth / (MAP_COLS * TILE_SIZE),
    availableHeight / (MAP_ROWS * TILE_SIZE),
  );

  layout.renderScale = Math.max(MIN_RENDER_SCALE, scaleToFit);
  layout.cellSize = TILE_SIZE * layout.renderScale;
  layout.mapWidth = MAP_COLS * layout.cellSize;
  layout.mapHeight = MAP_ROWS * layout.cellSize;
}
