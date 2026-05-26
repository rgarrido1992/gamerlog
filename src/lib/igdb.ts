/**
 * IGDB client v2 — fetches everything we need for the rich game detail page.
 */

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cached: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const id = process.env.IGDB_CLIENT_ID;
  const secret = process.env.IGDB_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set");
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Twitch token failed: ${res.status}`);
  const data: { access_token: string; expires_in: number } = await res.json();

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}

export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  first_release_date?: number;
  rating?: number;                              // IGDB rating 0-100
  cover?: { image_id: string };
  artworks?: { image_id: string }[];
  screenshots?: { image_id: string }[];
  videos?: { name?: string; video_id: string }[]; // YouTube video IDs
  genres?: { name: string }[];
  game_modes?: { name: string }[];
  involved_companies?: {
    company: { name: string };
    developer: boolean;
    publisher: boolean;
  }[];
  platforms?: { id: number; name: string }[];
  similar_games?: number[];
}

export function igdbImageUrl(
  imageId: string,
  size: "cover_big" | "1080p" | "720p" | "screenshot_huge" | "screenshot_big" = "1080p"
) {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

const FIELDS = `
  name, slug, summary, first_release_date, rating,
  cover.image_id,
  artworks.image_id,
  screenshots.image_id,
  videos.name, videos.video_id,
  genres.name,
  game_modes.name,
  involved_companies.company.name,
  involved_companies.developer, involved_companies.publisher,
  platforms.id, platforms.name,
  similar_games
`;

async function igdbQuery<T>(endpoint: string, body: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IGDB ${endpoint} failed: ${res.status} — ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function searchGames(query: string, limit = 12): Promise<IgdbGame[]> {
  const body = `
    search "${query.replace(/"/g, '\\"')}";
    fields ${FIELDS};
    limit ${limit};
  `;
  return igdbQuery<IgdbGame[]>("games", body);
}

export async function getGameById(id: number): Promise<IgdbGame | null> {
  const body = `where id = ${id}; fields ${FIELDS};`;
  const results = await igdbQuery<IgdbGame[]>("games", body);
  return results[0] ?? null;
}

export async function getGamesByIds(ids: number[]): Promise<IgdbGame[]> {
  if (ids.length === 0) return [];
  const body = `where id = (${ids.join(",")}); fields ${FIELDS}; limit ${ids.length};`;
  return igdbQuery<IgdbGame[]>("games", body);
}

/**
 * Transform an IGDB result into our DB shape.
 */
export function normalizeIgdbGame(g: IgdbGame) {
  const youtubeId = g.videos?.find((v) => v.video_id)?.video_id ?? null;
  return {
    igdbId: g.id,
    title: g.name,
    slug: g.slug,
    summary: g.summary ?? null,
    releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000) : null,
    igdbRating: g.rating ?? null,
    coverUrl: g.cover ? igdbImageUrl(g.cover.image_id, "cover_big") : null,
    artworkUrl: g.artworks?.[0]
      ? igdbImageUrl(g.artworks[0].image_id, "1080p")
      : g.screenshots?.[0]
      ? igdbImageUrl(g.screenshots[0].image_id, "1080p")
      : null,
    screenshots:
      g.screenshots?.map((s) => igdbImageUrl(s.image_id, "screenshot_huge")) ?? [],
    videoYoutubeId: youtubeId,
    genres: g.genres?.map((x) => x.name) ?? [],
    gameModes: g.game_modes?.map((x) => x.name) ?? [],
    developers:
      g.involved_companies?.filter((c) => c.developer).map((c) => c.company.name) ?? [],
    publishers:
      g.involved_companies?.filter((c) => c.publisher).map((c) => c.company.name) ?? [],
    igdbPlatformIds: g.platforms?.map((p) => p.id) ?? [],
    similarIgdbIds: g.similar_games ?? [],
  };
}
