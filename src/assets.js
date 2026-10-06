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

  k.loadSprite("chicken", "sprites/chicken.png", {
    sliceX: 4,
    sliceY: 2,
    anims: {
      idle: { frames: [0, 1], loop: true, speed: 3 },
    },
  });

  k.loadSprite("cow", "sprites/cow.png", {
    sliceX: 3,
    sliceY: 2,
    anims: {
      idle: { from: 0, to: 2, loop: true, speed: 2 },
    },
  });

  k.loadSprite("sheep", "sprites/sheep.png", {
    sliceX: 4,
    sliceY: 1,
    anims: {
      idle: { frames: [0, 1, 2, 3, 2, 1], loop: true, speed: 4 },
    },
  });

  k.loadSprite("fox", "sprites/fox.png", {
    sliceX: 4,
    sliceY: 1,
    anims: {
      idle: { frames: [0, 1, 0, 3, 0, 2], loop: true, speed: 3 },
    },
  });

  k.loadSprite("rabbit", "sprites/rabbit.png", {
    sliceX: 4,
    sliceY: 1,
    anims: {
      idle: { frames: [0, 1, 0, 2, 3], loop: true, speed: 4 },
    },
  });
}
