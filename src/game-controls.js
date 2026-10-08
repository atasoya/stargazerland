export function createGameControls({ onReset, onDownload }) {
  const controls = document.createElement("nav");
  controls.className = "game-controls";
  controls.hidden = true;
  controls.innerHTML = `
    <button type="button" data-action="reset">Reset</button>
    <button type="button" data-action="download">Download image</button>
  `;

  const resetButton = controls.querySelector('[data-action="reset"]');
  const downloadButton = controls.querySelector('[data-action="download"]');

  document.body.append(controls);

  resetButton.addEventListener("click", onReset);
  downloadButton.addEventListener("click", async () => {
    downloadButton.disabled = true;
    downloadButton.textContent = "Preparing...";

    try {
      await onDownload();
    } finally {
      downloadButton.disabled = false;
      downloadButton.textContent = "Download image";
    }
  });

  return {
    show() {
      controls.hidden = false;
    },
    hide() {
      controls.hidden = true;
    },
    destroy() {
      controls.remove();
    },
  };
}

const SHARE_WIDTH = 1200;
const SHARE_HEIGHT = 630;

export async function downloadCanvasImage(metadata = {}) {
  const canvas = document.querySelector("canvas");

  if (!canvas) throw new Error("Game canvas was not found.");

  const shareCanvas = createShareCanvas(canvas, metadata ?? {});
  const blob = await new Promise((resolve) => {
    shareCanvas.toBlob(resolve, "image/png");
  });

  if (!blob) throw new Error("Could not capture the game image.");

  const fileName = getShareFileName(metadata?.username);

  downloadBlob(blob, fileName);
}

function createShareCanvas(sourceCanvas, metadata) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = SHARE_WIDTH;
  canvas.height = SHARE_HEIGHT;

  drawShareBackground(ctx);
  drawMapPreview(ctx, sourceCanvas);
  drawSharePanel(ctx, metadata);

  return canvas;
}

function drawShareBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, SHARE_WIDTH, SHARE_HEIGHT);

  gradient.addColorStop(0, "#b7dfcb");
  gradient.addColorStop(1, "#78b8aa");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#e8f5c7";

  for (let y = 34; y < SHARE_HEIGHT; y += 42) {
    for (let x = 24 + ((y / 42) % 2) * 28; x < SHARE_WIDTH; x += 72) {
      ctx.fillRect(x, y, 18, 4);
    }
  }

  ctx.globalAlpha = 1;
}

function drawMapPreview(ctx, sourceCanvas) {
  const frame = { x: 44, y: 52, width: 700, height: 526, radius: 34 };

  ctx.save();
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
  ctx.clip();
  drawImageCover(ctx, sourceCanvas, frame.x, frame.y, frame.width, frame.height);
  ctx.restore();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(42, 72, 49, 0.2)";
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
  ctx.stroke();
}

function drawSharePanel(ctx, metadata) {
  const username = metadata.username ? `@${metadata.username}` : "GitHub explorer";
  const repoCount = metadata.repoCount ?? 0;
  const totalStars = metadata.totalStars ?? 0;

  ctx.fillStyle = "rgba(244, 239, 205, 0.9)";
  roundedRect(ctx, 790, 82, 350, 466, 32);
  ctx.fill();

  ctx.fillStyle = "#2c583a";
  ctx.font = "700 28px Optima, Candara, system-ui, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("STARGAZERLAND", 828, 142);

  ctx.font = "700 62px Charter, Georgia, serif";
  ctx.fillText("GitHub", 828, 224);
  ctx.fillText("islands", 828, 286);

  ctx.font = "700 30px Aptos, system-ui, sans-serif";
  ctx.fillStyle = "#244935";
  ctx.fillText(username, 828, 352);

  drawMetric(ctx, "Repos", repoCount, 828, 426);
  drawMetric(ctx, "Stars", totalStars, 988, 426);

  ctx.font = "700 24px Optima, Candara, system-ui, sans-serif";
  ctx.fillStyle = "#4a805f";
  ctx.fillText("stargazerland.ata.soy", 828, 504);
}

function drawMetric(ctx, label, value, x, y) {
  ctx.font = "800 40px Aptos, system-ui, sans-serif";
  ctx.fillStyle = "#315f42";
  ctx.fillText(String(value), x, y);
  ctx.font = "700 17px Optima, Candara, system-ui, sans-serif";
  ctx.fillStyle = "#5f8568";
  ctx.fillText(label.toUpperCase(), x, y + 28);
}

function drawImageCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  ctx.drawImage(
    image,
    x + (width - scaledWidth) / 2,
    y + (height - scaledHeight) / 2,
    scaledWidth,
    scaledHeight,
  );
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getShareFileName(username) {
  return username ? `stargazerland-${username}.png` : "stargazerland.png";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
