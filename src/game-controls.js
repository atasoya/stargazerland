export function createGameControls({ onReset, onShare }) {
  const controls = document.createElement("nav");
  controls.className = "game-controls";
  controls.hidden = true;
  controls.innerHTML = `
    <button type="button" data-action="reset">Reset</button>
    <button type="button" data-action="share">Share image</button>
  `;

  const resetButton = controls.querySelector('[data-action="reset"]');
  const shareButton = controls.querySelector('[data-action="share"]');

  document.body.append(controls);

  resetButton.addEventListener("click", onReset);
  shareButton.addEventListener("click", async () => {
    shareButton.disabled = true;
    shareButton.textContent = "Preparing...";

    try {
      await onShare();
    } finally {
      shareButton.disabled = false;
      shareButton.textContent = "Share image";
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

export async function shareCanvasImage() {
  const canvas = document.querySelector("canvas");

  if (!canvas) throw new Error("Game canvas was not found.");

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) throw new Error("Could not capture the game image.");

  const file = new File([blob], "stargazerland.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Stargazerland",
      text: "My GitHub island map",
    });

    return;
  }

  downloadBlob(blob);
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "stargazerland.png";
  link.click();
  URL.revokeObjectURL(url);
}
