export function loadAssets(k) {
  k.loadRoot("./");

  k.loadSprite("character", "sprites/character.png", {
    sliceX: 4,
    sliceY: 4,
    anims: {
      idleFront: { from: 0, to: 1, loop: true, speed: 2 },
      moveFront: { from: 2, to: 4, loop: true, speed: 8 },
      idleBack: { from: 4, to: 6 },
      moveBack: { from: 6, to: 8, loop: true, speed: 8 },
    },
  });

  k.loadSprite("water", "sprites/water.png");

  k.loadSprite("grass", "sprites/grass.png", {
    sliceX: 11,
    sliceY: 7,
  });
}
