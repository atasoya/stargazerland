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
  const repoUi = [];
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

  const population = createPopulation(k, islands, layout, getTilePos);

  function clearRepoUi() {
    while (repoUi.length > 0) {
      const item = repoUi.pop();

      item.hitBox.destroy();
      item.highlight.destroy();
      item.labelText.destroy();
      item.labelShadow.destroy();
    }
  }

  function rebuildRepoUi() {
    clearRepoUi();

    for (const island of islands) {
      if (!island.url || island.tiles.length === 0) continue;

      repoUi.push(createRepoIslandUi(k, island, layout, getTilePos));
    }
  }

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
    resizePopulation(population.people, layout, getTilePos);
    rebuildRepoUi();
  }

  const cursorEvent = k.onUpdate(() => {
    k.setCursor("default");
    animateRepoUi(repoUi, k.dt());
  });
  const hoverEvent = k.onHoverUpdate("repoIsland", (target) => {
    k.setCursor("pointer");
    setRepoIslandHover(target, true);
  });
  const hoverEndEvent = k.onHoverEnd("repoIsland", (target) => {
    setRepoIslandHover(target, false);
  });
  const clickEvent = k.onClick("repoIsland", (target) => {
    globalThis.open?.(target.url, "_blank", "noopener,noreferrer");
  });
  const resizeEvent = k.onResize(resizeWorld);
  resizeWorld();

  return {
    destroy() {
      clickEvent?.cancel?.();
      cursorEvent?.cancel?.();
      hoverEndEvent?.cancel?.();
      hoverEvent?.cancel?.();
      resizeEvent?.cancel?.();
      clearRepoUi();
      population.destroy();
      player.destroy();

      while (waterTiles.length > 0) {
        waterTiles.pop().destroy();
      }

      while (grassTiles.length > 0) {
        grassTiles.pop().tile.destroy();
      }
    },
  };
}

function createRepoIslandUi(k, island, layout, getTilePos) {
  const bounds = getIslandBounds(island.tiles, layout, getTilePos);
  const labelSize = Math.max(8, Math.round(layout.renderScale * 4.2));
  const labelText = formatRepoLabel(island.name);
  const labelWidth = layout.cellSize * 4.2;
  const labelHeight = labelSize * 1.3;
  const labelGap = layout.cellSize * 0.2;
  let labelY = bounds.maxY + labelGap + labelHeight * 0.5;

  if (labelY + labelHeight * 0.5 > k.height() - 4) {
    labelY = bounds.minY - labelGap - labelHeight * 0.5;
  }

  const highlight = k.add([
    k.pos(bounds.minX, bounds.minY),
    k.rect(bounds.width, bounds.height),
    k.color(246, 224, 134),
    k.opacity(0),
    k.z(-4),
  ]);
  const labelShadow = k.add([
    k.pos(bounds.centerX + 1, labelY + 1),
    k.text(labelText, {
      size: labelSize,
      width: labelWidth,
      align: "center",
      anchor: "center",
    }),
    k.color(224, 235, 191),
    k.opacity(0),
    k.scale(0.94),
    k.z(7),
  ]);
  const label = k.add([
    k.pos(bounds.centerX, labelY),
    k.text(labelText, {
      size: labelSize,
      width: labelWidth,
      align: "center",
      anchor: "center",
    }),
    k.color(42, 72, 49),
    k.opacity(0),
    k.scale(0.94),
    k.z(8),
  ]);
  const labelMinX = bounds.centerX - labelWidth / 2;
  const labelMinY = labelY - labelHeight / 2;
  const labelMaxX = bounds.centerX + labelWidth / 2;
  const labelMaxY = labelY + labelHeight / 2;
  const hitMinX = Math.min(bounds.minX, labelMinX) - layout.cellSize * 0.12;
  const hitMinY = Math.min(bounds.minY, labelMinY) - layout.cellSize * 0.12;
  const hitMaxX = Math.max(bounds.maxX, labelMaxX) + layout.cellSize * 0.12;
  const hitMaxY = Math.max(bounds.maxY, labelMaxY) + layout.cellSize * 0.12;
  const hitBox = k.add([
    k.pos(hitMinX, hitMinY),
    k.rect(hitMaxX - hitMinX, hitMaxY - hitMinY),
    k.area(),
    k.opacity(0),
    k.z(12),
    "repoIsland",
    {
      url: island.url,
      highlight,
      label,
      labelShadow,
      isHovered: false,
      hoverProgress: 0,
      labelBaseY: labelY,
      shadowBaseY: labelY + 1,
      labelLift: layout.cellSize * 0.18,
    },
  ]);

  return { hitBox, highlight, labelText: label, labelShadow };
}

function getIslandBounds(tiles, layout, getTilePos) {
  const cols = tiles.map((tile) => tile.col);
  const rows = tiles.map((tile) => tile.row);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const min = getTilePos(minCol, minRow);
  const max = getTilePos(maxCol, maxRow);
  const maxX = max.x + layout.cellSize;
  const maxY = max.y + layout.cellSize;

  return {
    minX: min.x,
    minY: min.y,
    maxX,
    maxY,
    width: maxX - min.x,
    height: maxY - min.y,
    centerX: min.x + (maxX - min.x) / 2,
  };
}

function formatRepoLabel(name) {
  if (name.length <= 18) return name;

  return `${name.slice(0, 15)}...`;
}

function setRepoIslandHover(target, isHovered) {
  target.isHovered = isHovered;
}

function animateRepoUi(repoUi, dt) {
  for (const item of repoUi) {
    const target = item.hitBox;
    const goal = target.isHovered ? 1 : 0;
    const speed = target.isHovered ? 14 : 10;
    const step = Math.min(1, dt * speed);

    target.hoverProgress += (goal - target.hoverProgress) * step;

    const progress = easeOutQuart(target.hoverProgress);
    const lift = (1 - progress) * target.labelLift;
    const labelScale = 0.94 + progress * 0.08;

    target.highlight.opacity = progress * 0.22;
    target.label.opacity = progress;
    target.labelShadow.opacity = progress * 0.75;
    target.label.pos.y = target.labelBaseY + lift;
    target.labelShadow.pos.y = target.shadowBaseY + lift;
    target.label.scaleTo(labelScale);
    target.labelShadow.scaleTo(labelScale);
  }
}

function easeOutQuart(value) {
  return 1 - (1 - value) ** 4;
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
