import kaplay from "kaplay";

const k = kaplay({
  crisp: true,
});

k.loadRoot("./");

k.loadSprite("character", "sprites/character.png", {
  sliceX: 4,
  sliceY: 4,
  anims: {
    idleFront: { from: 0, to: 1, loop: true, speed: 2 },
    moveFront: { from: 2, to: 4 },
    idleBack: { from: 4, to: 6 },
    moveBack: { from: 6, to: 8 },
  },
});

k.loadSprite("water", "sprites/water.png");

const water = k.add([
  k.pos(0, 0),
  k.sprite("water", {
    tiled: true,
    width: k.width(),
    height: k.height(),
  }),
  k.fixed(),
  k.z(-10),
]);

k.onResize(() => {
  water.width = k.width();
  water.height = k.height();
});

const player = k.add([k.pos(120, 80), k.sprite("character"), k.scale(2)]);

player.play("idleFront");
