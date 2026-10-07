export function showStartScreen(onStart) {
  const overlay = document.createElement("section");
  overlay.className = "start-screen";
  overlay.innerHTML = `
    <form class="start-card">
      <p class="start-kicker">Stargazerland census</p>
      <h1>What is your GitHub username?</h1>
      <label class="name-field">
        <span>GitHub username</span>
        <input name="githubUsername" autocomplete="username" maxlength="39" pattern="[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?" placeholder="octocat" required />
      </label>
      <p class="start-status" role="status" aria-live="polite"></p>
      <button type="submit">Chart my islands</button>
    </form>
  `;

  document.body.append(overlay);
  document.body.classList.add("is-starting");

  const form = overlay.querySelector("form");
  const input = overlay.querySelector("input");
  const button = overlay.querySelector("button");
  const status = overlay.querySelector(".start-status");
  let pending = false;

  focusInputWhenSafe(input);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = input.value.trim();

    if (!username || pending) return;

    pending = true;
    form.dataset.state = "loading";
    status.textContent = `Gathering ${username}'s repositories...`;
    button.disabled = true;
    input.disabled = true;

    try {
      await onStart(username);
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "Something went wrong.";
      form.dataset.state = "error";
      pending = false;
      button.disabled = false;
      input.disabled = false;
      focusInputWhenSafe(input);

      return;
    }

    document.body.classList.remove("is-starting");
    overlay.remove();
  });
}

function focusInputWhenSafe(input) {
  if (globalThis.matchMedia?.("(pointer: coarse)").matches) return;

  input.focus();
}
