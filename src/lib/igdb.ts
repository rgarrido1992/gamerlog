/**
 * IGDB client.
 *
 * IGDB uses Twitch OAuth client credentials. To get keys:
 *   1. Create a Twitch app at https://dev.twitch.tv/console/apps
 *   2. Copy Client ID and generate a Client Secret
 *   3. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET env vars
 *
 * Docs: https://api-docs.igdb.com/
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
  first_release_date?: number; // unix seconds
  cover?: { image_id: string };
  genres?: { name: string }[];
  involved_companies?: {
    company: { name: string };
    developer: boolean;
    publisher: boolean;
  }[];
  platforms?: { id: number; name: string }[];
}

export function igdbCoverUrl(imageId: string, size: "cover_big" | "1080p" | "720p" = "1080p") {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

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

export async function searchGames(query: string, limit = 10): Promise<IgdbGame[]> {
  const body = `
    search "${query.replace(/"/g, '\\"')}";
    fields name, slug, summary, first_release_date, cover.image_id,
           genres.name, involved_companies.company.name,
           involved_companies.developer, involved_companies.publisher,
           platforms.id, platforms.name;
    limit ${limit};
  `;
  return igdbQuery<IgdbGame[]>("games", body);
}

export async function getGameById(id: number): Promise<IgdbGame | null> {
  const body = `
    where id = ${id};
    fields name, slug, summary, first_release_date, cover.image_id,
           genres.name, involved_companies.company.name,
           involved_companies.developer, involved_companies.publisher,
           platforms.id, platforms.name;
  `;
  const results = await igdbQuery<IgdbGame[]>("games", body);
  return results[0] ?? null;
}
