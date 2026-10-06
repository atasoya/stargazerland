import {
  MAP_COLS,
  MAP_ROWS,
  MIN_ISLAND_GAP,
  POPULATION_SIZE_RATIO,
  islandSizes,
} from "./config.js";

function cellKey(col, row) {
  return `${col},${row}`;
}

function isInMap(col, row) {
  return col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distanceSquared(a, b) {
  const dx = a.col - b.col;
  const dy = a.row - b.row;

  return dx * dx + dy * dy;
}

function getIslandAspect(islandIndex) {
  return 0.95 + ((islandIndex * 7) % 6) * 0.1;
}

function getIslandOrigin(islandIndex, islandCount, occupied, blocked) {
  const angle = islandIndex * Math.PI * (3 - Math.sqrt(5));
  const radius =
    islandCount <= 1 ? 0 : Math.sqrt((islandIndex + 0.5) / islandCount);
  const center = {
    col: (MAP_COLS - 1) / 2,
    row: (MAP_ROWS - 1) / 2,
  };
  const target = {
    col: Math.round(center.col + Math.cos(angle) * radius * MAP_COLS * 0.42),
    row: Math.round(center.row + Math.sin(angle) * radius * MAP_ROWS * 0.42),
  };
  const origin = {
    col: clamp(target.col, 1, MAP_COLS - 2),
    row: clamp(target.row, 1, MAP_ROWS - 2),
  };
  const candidates = [];

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const key = cellKey(col, row);

      if (occupied.has(key) || blocked.has(key)) continue;

      candidates.push({
        col,
        row,
        score: distanceSquared({ col, row }, origin),
      });
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  return candidates[0] ?? null;
}

function blockIslandRing(cells, blocked, gap) {
  for (const key of cells) {
    const [col, row] = key.split(",").map(Number);

    for (let rowOffset = -gap; rowOffset <= gap; rowOffset++) {
      for (let colOffset = -gap; colOffset <= gap; colOffset++) {
        const nextCol = col + colOffset;
        const nextRow = row + rowOffset;

        if (isInMap(nextCol, nextRow)) {
          blocked.add(cellKey(nextCol, nextRow));
        }
      }
    }
  }
}

function scoreIslandCell(col, row, origin, radiusX, radiusY, islandIndex) {
  const dx = (col - origin.col) / radiusX;
  const dy = (row - origin.row) / radiusY;
  const ovalDistance = dx * dx + dy * dy;
  const edgeWobble = ((col * 17 + row * 31 + islandIndex * 13) % 10) / 20;

  return ovalDistance + edgeWobble;
}

function generateIslandCells(
  relativeSize,
  islandIndex,
  islandCount,
  occupied,
  blocked,
) {
  const origin = getIslandOrigin(islandIndex, islandCount, occupied, blocked);
  const targetSize = Math.max(1, Math.round(relativeSize));
  const cells = new Set();

  if (!origin || !isInMap(origin.col, origin.row)) return cells;

  const aspect = getIslandAspect(islandIndex);
  const radiusY = Math.max(1, Math.sqrt(targetSize / (Math.PI * aspect)));
  const radiusX = radiusY * aspect;
  const originKey = cellKey(origin.col, origin.row);
  const seen = new Set([originKey]);
  const frontier = [originKey];

  cells.add(originKey);

  while (cells.size < targetSize && frontier.length > 0) {
    let bestIndex = 0;
    let bestScore = Infinity;

    for (let index = 0; index < frontier.length; index++) {
      const [col, row] = frontier[index].split(",").map(Number);
      const score = scoreIslandCell(
        col,
        row,
        origin,
        radiusX,
        radiusY,
        islandIndex,
      );

      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const selectedKey = frontier.splice(bestIndex, 1)[0];
    const [col, row] = selectedKey.split(",").map(Number);

    cells.add(selectedKey);

    for (const [colOffset, rowOffset] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nextCol = col + colOffset;
      const nextRow = row + rowOffset;

      if (!isInMap(nextCol, nextRow)) continue;

      const key = cellKey(nextCol, nextRow);

      if (seen.has(key) || occupied.has(key) || blocked.has(key)) continue;

      seen.add(key);
      frontier.push(key);
    }
  }

  for (const key of cells) {
    occupied.add(key);
  }

  return cells;
}

export function generateIslandMap(sizesByIsland = islandSizes) {
  return generateIslandWorld(sizesByIsland).map;
}

export function generateIslandWorld(sizesByIsland = islandSizes, options = {}) {
  const gap = options.gap ?? MIN_ISLAND_GAP;
  const rows = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill("."),
  );
  const occupied = new Set();
  const blocked = new Set();
  const entries = Object.entries(sizesByIsland).map(([name, value]) => [
    name,
    getIslandConfig(value),
  ]);
  const sizes = entries.map(([, island]) => island.relativeSize);
  const islands = [];

  entries.forEach(([name, island], islandIndex) => {
    const { relativeSize } = island;
    const cells = generateIslandCells(
      relativeSize,
      islandIndex,
      sizes.length,
      occupied,
      blocked,
    );
    const tiles = [];

    for (const key of cells) {
      const [col, row] = key.split(",").map(Number);
      rows[row][col] = "#";
      tiles.push({ col, row });
    }

    if (cells.size > 0) {
      blockIslandRing(cells, blocked, gap);
    }

    islands.push({
      name,
      url: island.url,
      relativeSize,
      tiles,
      population: getIslandPopulation(
        relativeSize,
        tiles.length,
        island.population,
      ),
    });
  });

  const world = {
    map: rows.map((row) => row.join("")),
    islands,
  };

  return options.transpose ? transposeIslandWorld(world) : world;
}

function transposeIslandWorld(world) {
  const sourceRows = world.map;
  const rowCount = sourceRows.length;
  const colCount = sourceRows[0]?.length ?? 0;
  const map = Array.from({ length: colCount }, (_, row) =>
    Array.from({ length: rowCount }, (_, col) => sourceRows[col][row]).join(""),
  );
  const islands = world.islands.map((island) => ({
    ...island,
    tiles: island.tiles.map((tile) => ({ col: tile.row, row: tile.col })),
  }));

  return { map, islands };
}

function getIslandConfig(value) {
  if (typeof value === "number") {
    return { relativeSize: value };
  }

  return {
    relativeSize: value.relativeSize,
    population: value.population,
    url: value.url,
  };
}

function getIslandPopulation(relativeSize, tileCount, explicitPopulation) {
  if (tileCount === 0) return 0;

  if (explicitPopulation !== undefined) {
    return Math.max(0, Math.round(explicitPopulation));
  }

  return Math.min(
    tileCount,
    Math.max(1, Math.round(relativeSize / POPULATION_SIZE_RATIO)),
  );
}

export function findFirstLandTile(islandMap) {
  for (let row = 0; row < islandMap.length; row++) {
    const col = islandMap[row].indexOf("#");

    if (col !== -1) return { col, row };
  }

  return { col: 0, row: 0 };
}
