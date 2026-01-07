import "./style.css";

import {
  DiscogsClient,
  type GetReleasesResponse,
} from "@lionralfs/discogs-client";

const user = "kasn";

const client = new DiscogsClient({ userAgent: "DiscogsShuffle/1.0" });

const output = document.querySelector<HTMLDivElement>("#output")!;
const shuffle = document.querySelector<HTMLDivElement>("#shuffle")!;
const clearCache = document.querySelector<HTMLDivElement>("#clear")!;

type TReleases = Pick<GetReleasesResponse, "releases">["releases"];
type TRelease = TReleases[number];

async function loadFromDiscogs(): Promise<TReleases> {
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

async function getCollection(): Promise<TReleases> {
  if (localStorage.getItem("releases")) {
    return JSON.parse(localStorage.getItem("releases")!);
  }

  const releases = await loadFromDiscogs();

  localStorage.setItem("releases", JSON.stringify(releases));

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

shuffle.addEventListener("click", async () => {
  const releases = await getCollection();

  const listenNow = releases[Math.floor(Math.random() * releases.length)];

  output.innerHTML = `
    <img src="${listenNow.basic_information.cover_image}" alt="${getTitle(
    listenNow
  )} cover image"/>
    <h1>${getTitle(listenNow)}</h1>
    <h2>${getArtist(listenNow)}</h2>    
  `;
});

clearCache.addEventListener("click", () => {
  localStorage.removeItem("releases");
  output.innerHTML = "Cache cleared";
});
