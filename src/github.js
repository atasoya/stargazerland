const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 3;
const MAX_ISLANDS = 20;
const ISLAND_LAND_BUDGET = 140;
const MAX_ISLAND_SIZE = 48;

export async function fetchRepoIslandSizes(username) {
  const repos = await fetchPublicRepos(username);

  if (repos.length === 0) {
    throw new Error(`No public repositories found for "${username}".`);
  }

  const sizes = reposToIslandSizes(repos);

  if (Object.keys(sizes).length === 0) {
    throw new Error(`No starred public repositories found for "${username}".`);
  }

  return sizes;
}

export function reposToIslandSizes(repos) {
  const ranked = [...repos]
    .filter((repo) => (repo.stargazers_count ?? 0) > 0)
    .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
    .slice(0, MAX_ISLANDS);
  const weights = ranked.map(
    (repo) => Math.sqrt(repo.stargazers_count ?? 0) + 1,
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const sizes = Object.create(null);

  ranked.forEach((repo, index) => {
    const share = (weights[index] / totalWeight) * ISLAND_LAND_BUDGET;
    const size = Math.round(share);

    sizes[repo.name] = {
      relativeSize: Math.min(MAX_ISLAND_SIZE, Math.max(1, size)),
      population: repo.stargazers_count ?? 0,
      url: repo.html_url,
    };
  });

  return sizes;
}

async function fetchPublicRepos(username) {
  const repos = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=${PER_PAGE}&page=${page}`;
    let response;

    try {
      response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
      });
    } catch {
      throw new Error("Could not reach GitHub. Check your connection.");
    }

    if (!response.ok) throw toHttpError(response, username);

    const batch = await response.json();

    repos.push(...batch);

    if (batch.length < PER_PAGE) break;
  }

  return repos;
}

function toHttpError(response, username) {
  if (response.status === 404) {
    return new Error(`No GitHub user named "${username}".`);
  }

  if (response.status === 403 || response.status === 429) {
    return new Error("GitHub rate limit reached. Try again in a minute.");
  }

  return new Error(`GitHub request failed (${response.status}).`);
}
