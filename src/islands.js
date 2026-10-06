import { MAP_COLS, MAP_ROWS, islandSizes } from "./config.js";

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

function getIslandOrigin(islandIndex, islandCount, occupied) {
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

      if (occupied.has(key)) continue;

      candidates.push({
        col,
        row,
        score: distanceSquared({ col, row }, origin),
      });
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  return candidates[0] ?? origin;
}

function scoreIslandCell(col, row, origin, radiusX, radiusY, islandIndex) {
  const dx = (col - origin.col) / radiusX;
  const dy = (row - origin.row) / radiusY;
  const ovalDistance = dx * dx + dy * dy;
  const edgeWobble = ((col * 17 + row * 31 + islandIndex * 13) % 10) / 20;

  return ovalDistance + edgeWobble;
}

function generateIslandCells(relativeSize, islandIndex, islandCount, occupied) {
  const origin = getIslandOrigin(islandIndex, islandCount, occupied);
  const targetSize = Math.max(1, Math.round(relativeSize));
  const cells = new Set();
  const candidates = [];

  if (!origin || !isInMap(origin.col, origin.row)) return cells;

  const aspect = getIslandAspect(islandIndex);
  const radiusY = Math.max(1, Math.sqrt(targetSize / (Math.PI * aspect)));
  const radiusX = radiusY * aspect;

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const key = cellKey(col, row);

      if (occupied.has(key)) continue;

      candidates.push({
        col,
        row,
        key,
        score: scoreIslandCell(col, row, origin, radiusX, radiusY, islandIndex),
      });
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  for (const candidate of candidates) {
    if (cells.size >= targetSize) break;

    cells.add(candidate.key);
    occupied.add(candidate.key);
  }

  return cells;
}

export function generateIslandMap(sizesByIsland = islandSizes) {
  const rows = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill("."),
  );
  const occupied = new Set();
  const sizes = Object.values(sizesByIsland);

  sizes.forEach((relativeSize, islandIndex) => {
    const cells = generateIslandCells(
      relativeSize,
      islandIndex,
      sizes.length,
      occupied,
    );

    for (const key of cells) {
      const [col, row] = key.split(",").map(Number);
      rows[row][col] = "#";
    }
  });

  return rows.map((row) => row.join(""));
}

export function findFirstLandTile(islandMap) {
  for (let row = 0; row < islandMap.length; row++) {
    const col = islandMap[row].indexOf("#");

    if (col !== -1) return { col, row };
  }

  return { col: 0, row: 0 };
}
