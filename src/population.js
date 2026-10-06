import { BASE_SCALE } from "./config.js";

const populationSpecs = [
  {
    sprite: "character",
    animation: "idleFront",
    width: 96,
    height: 96,
    z: 3,
  },
  {
    sprite: "chicken",
    animation: "idle",
    width: 31,
    height: 31,
    z: 3,
  },
  {
    sprite: "cow",
    animation: "idle",
    width: 77,
    height: 77,
    z: 3,
  },
  {
    sprite: "sheep",
    animation: "idle",
    width: 43,
    height: 58,
    z: 3,
  },
  {
    sprite: "fox",
    animation: "idle",
    width: 41,
    height: 54,
    z: 3,
  },
  {
    sprite: "rabbit",
    animation: "idle",
    width: 38,
    height: 51,
    z: 3,
  },
];

export function createPopulation(k, islands, layout, getTilePos) {
  const people = islands.flatMap((island, islandIndex) => {
    const tiles = [...island.tiles].sort((a, b) => a.row - b.row || a.col - b.col);
    const used = new Set();
    const people = [];

    for (let personIndex = 0; personIndex < island.population; personIndex++) {
      const tile = pickPopulationTile(tiles, used, islandIndex, personIndex);

      if (!tile) continue;

      const spec = pickPopulationSpec(islandIndex, personIndex);
      const position = getCharacterPos(spec, layout, getTilePos(tile.col, tile.row));
      const character = k.add([
        k.pos(position.x, position.y),
        k.sprite(spec.sprite, getSpriteSize(spec, layout)),
        k.z(spec.z),
      ]);

      character.play(spec.animation);
      people.push({ character, col: tile.col, row: tile.row, spec, islandIndex, personIndex });
    }

    return people;
  });

  k.onUpdate(() => {
    animatePopulation(people, layout, getTilePos, k.time());
  });

  return people;
}

export function resizePopulation(people, layout, getTilePos) {
  for (const person of people) {
    resetCharacter(person, layout, getTilePos);
  }
}

function animatePopulation(people, layout, getTilePos, time) {
  for (const person of people) {
    const { character, col, row, spec, islandIndex, personIndex } = person;
    const position = getCharacterPos(spec, layout, getTilePos(col, row));
    const size = getSpriteSize(spec, layout);
    const seed = islandIndex * 97 + personIndex * 37;
    const cycle = 2.2 + seededUnit(seed, 1) * 2.4;
    const phase = ((time + seededUnit(seed, 2) * cycle) % cycle) / cycle;

    if (phase < 0.45) {
      character.pos.x = position.x;
      character.pos.y = position.y;
      character.width = size.width;
      character.height = size.height;
      continue;
    }

    const wave = Math.sin((time * (2.4 + seededUnit(seed, 3) * 1.6) + seed) * Math.PI * 2);
    const hop = Math.max(0, wave) * layout.renderScale * 0.9;
    const sway = Math.sin(time * 2 + seed) * layout.renderScale * 0.45;
    const pulse = 1 + Math.sin(time * 5 + seed) * 0.025;

    character.width = size.width * (2 - pulse);
    character.height = size.height * pulse;
    character.pos.x = position.x + sway + (size.width - character.width) / 2;
    character.pos.y = position.y - hop + (size.height - character.height);
  }
}

function resetCharacter(person, layout, getTilePos) {
  const { character, col, row, spec } = person;
  const position = getCharacterPos(spec, layout, getTilePos(col, row));

  character.pos.x = position.x;
  character.pos.y = position.y;
  setSpriteSize(character, spec, layout);
}

function pickPopulationTile(tiles, used, islandIndex, personIndex) {
  if (tiles.length === 0) return null;

  for (let attempt = 0; attempt < tiles.length; attempt++) {
    const index = seededIndex(islandIndex, personIndex, attempt, tiles.length);
    const tile = tiles[index];
    const key = `${tile.col},${tile.row}`;

    if (used.has(key)) continue;

    used.add(key);

    return tile;
  }

  return null;
}

function seededIndex(islandIndex, personIndex, attempt, length) {
  const seed = (islandIndex + 1) * 73856093 + (personIndex + 1) * 19349663 + attempt * 83492791;

  return Math.abs(seed) % length;
}

function seededUnit(seed, salt) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

function pickPopulationSpec(islandIndex, personIndex) {
  const index = seededIndex(islandIndex, personIndex, 0, populationSpecs.length);

  return populationSpecs[index];
}

function getCharacterPos(spec, layout, tilePos) {
  const { width, height } = getSpriteSize(spec, layout);

  return {
    x: tilePos.x + (layout.cellSize - width) / 2,
    y: tilePos.y + layout.cellSize - height,
  };
}

function getSpriteSize(spec, layout) {
  const scale = layout.renderScale / BASE_SCALE;

  return {
    width: spec.width * scale,
    height: spec.height * scale,
  };
}

function setSpriteSize(character, spec, layout) {
  const { width, height } = getSpriteSize(spec, layout);

  character.width = width;
  character.height = height;
}
