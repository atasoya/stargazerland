const grassFrames = {
  0: 36,
  1: 25,
  2: 33,
  3: 37,
  4: 3,
  5: 14,
  6: 4,
  7: 48,
  8: 35,
  9: 40,
  10: 34,
  11: 41,
  12: 7,
  13: 51,
  14: 8,
  15: 52,
  19: 22,
  23: 15,
  27: 39,
  31: 42,
  38: 0,
  39: 26,
  46: 6,
  47: 31,
  55: 11,
  63: 50,
  76: 2,
  77: 29,
  78: 5,
  79: 32,
  95: 9,
  110: 1,
  111: 30,
  127: 28,
  137: 24,
  139: 38,
  141: 18,
  143: 43,
  155: 23,
  159: 19,
  175: 20,
  191: 17,
  205: 13,
  207: 49,
  223: 16,
  239: 27,
  255: 12,
};

const interiorFrames = [12, 55, 56, 57, 66, 67, 68];

export function getGrassFrame(isLand, col, row) {
  const north = isLand(col, row - 1);
  const east = isLand(col + 1, row);
  const south = isLand(col, row + 1);
  const west = isLand(col - 1, row);

  let mask = 0;

  if (north) mask |= 1;
  if (east) mask |= 2;
  if (south) mask |= 4;
  if (west) mask |= 8;
  if (north && east && isLand(col + 1, row - 1)) mask |= 16;
  if (east && south && isLand(col + 1, row + 1)) mask |= 32;
  if (south && west && isLand(col - 1, row + 1)) mask |= 64;
  if (west && north && isLand(col - 1, row - 1)) mask |= 128;

  if (mask === 255) {
    const variation = (col * 13 + row * 7) % 10;

    return variation < interiorFrames.length ? interiorFrames[variation] : 12;
  }

  return grassFrames[mask] ?? 12;
}
