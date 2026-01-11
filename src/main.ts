import "./style.css";

import {
  DiscogsClient,
  type GetReleasesResponse,
} from "@lionralfs/discogs-client";

const client = new DiscogsClient({ userAgent: "KasnDiscogsShuffle/1.0" });

const userNameInput = document.querySelector<HTMLInputElement>("#username")!;
const outletElement = document.querySelector<HTMLDivElement>("#outlet")!;
const shuffleForm = document.querySelector<HTMLFormElement>("#shuffle-form")!;
const clearCacheButton = document.querySelector<HTMLDivElement>("#clear")!;

type TReleases = Pick<GetReleasesResponse, "releases">["releases"];
type TRelease = TReleases[number];

async function loadFromDiscogs(user: string): Promise<TReleases> {
  const collection = client.user().collection();

  let results: TReleases = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await collection.getReleases(user, 0, {
      page: page,
      per_page: 100,
    });

    totalPages = response.data.pagination.pages;
    page++;
    results = [...results, ...response.data.releases];
  } while (page <= totalPages);

  return results;
}

async function getCollection(user: string): Promise<TReleases> {
  const localStorageKey = `releases_${user}`;

  if (localStorage.getItem(localStorageKey)) {
    return JSON.parse(localStorage.getItem(localStorageKey)!);
  }

  const releases = await loadFromDiscogs(user);

  localStorage.setItem(localStorageKey, JSON.stringify(releases));

  return releases;
}

function getArtist(release: TRelease): string {
  return release.basic_information.artists
    .map((artist: any) => artist.name)
    .join(", ");
}

function getTitle(release: TRelease): string {
  return release.basic_information.title;
}

function render(html: string) {
  outletElement.innerHTML = html;
}

async function shuffle(user: string) {
  let releases: TReleases;

  try {
    releases = await getCollection(user);
  } catch (error) {
    render(
      "Error loading collection. Please check the username or switch your collection to public "
    );
    return;
  }

  const listenNow = releases[Math.floor(Math.random() * releases.length)];

  render(`
    <div class="release">
      <div class="cover-image">
      <img src="${listenNow.basic_information.cover_image}" alt="${getTitle(
    listenNow
  )} cover image"/>
      </div>
      <h2>${getArtist(listenNow)}</h2>            
      <h1>${getTitle(listenNow)}</h1>      
    </div>
  `);
}

shuffleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = userNameInput.value || "";

  if (!user) {
    render("Please enter a username");
    return;
  }

  localStorage.setItem("username", user);

  render("Loading collection...");

  shuffle(user);
});

clearCacheButton.addEventListener("click", () => {
  localStorage.removeItem("releases");
  localStorage.removeItem("username");
  userNameInput.value = "";
  render("Cache cleared");
});

function init() {
  const savedUser = localStorage.getItem("username");
  if (savedUser !== null) {
    userNameInput.value = savedUser;

    render("Loading collection...");

    shuffle(savedUser);
    return;
  }
  render("Enter your Discogs username and click Shuffle!");
}

init();
