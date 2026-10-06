import {
  MAP_COLS,
  MAP_ROWS,
  islandAspects,
  islandOrigins,
  islandSizes,
} from "./config.js";

function cellKey(col, row) {
  return `${col},${row}`;
}

function isInMap(col, row) {
  return col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS;
}

function scoreIslandCell(col, row, origin, radiusX, radiusY, islandIndex) {
  const dx = (col - origin.col) / radiusX;
  const dy = (row - origin.row) / radiusY;
  const ovalDistance = dx * dx + dy * dy;
  const edgeWobble = ((col * 17 + row * 31 + islandIndex * 13) % 10) / 20;

  return ovalDistance + edgeWobble;
}

function generateIslandCells(name, relativeSize, islandIndex, occupied) {
  const origin = islandOrigins[name];
  const targetSize = Math.max(1, Math.round(relativeSize));
  const cells = new Set();
  const candidates = [];

  if (!origin || !isInMap(origin.col, origin.row)) return cells;

  const aspect = islandAspects[name] ?? 1;
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

export function generateIslandMap() {
  const rows = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill("."),
  );
  const occupied = new Set();

  Object.entries(islandSizes).forEach(([name, relativeSize], islandIndex) => {
    const cells = generateIslandCells(
      name,
      relativeSize,
      islandIndex,
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
