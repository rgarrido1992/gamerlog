/**
 * OpenCritic API client.
 *
 * Uses the free tier of opencritic-api.p.rapidapi.com (RapidAPI).
 * Free tier: 25 requests/day, which is fine since we cache aggressively
 * (a game's score is fetched once and stored in our DB forever, only refreshing
 * if explicitly asked).
 *
 * Setup:
 *   1. Sign up at https://rapidapi.com/auth/sign-up
 *   2. Subscribe to "OpenCritic API" (free tier)
 *   3. Copy your X-RapidAPI-Key and set OPENCRITIC_RAPIDAPI_KEY
 *
 * If OPENCRITIC_RAPIDAPI_KEY is not set, all functions return null silently
 * (the app keeps working, just without OpenCritic data).
 */

interface OpenCriticSearchResult {
  id: number;
  name: string;
  dist?: number;
}

interface OpenCriticGame {
  id: number;
  name: string;
  topCriticScore?: number;     // 0-100
  percentRecommended?: number;
  tier?: "Mighty" | "Strong" | "Fair" | "Weak";
  url?: string;                // OC page URL
}

const BASE = "https://opencritic-api.p.rapidapi.com";

function getKey(): string | null {
  return process.env.OPENCRITIC_RAPIDAPI_KEY || null;
}

async function ocFetch<T>(path: string): Promise<T | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": "opencritic-api.p.rapidapi.com",
      },
    });
    if (!res.ok) {
      console.warn(`OpenCritic ${path} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn("OpenCritic fetch failed:", err);
    return null;
  }
}

export async function searchOpenCritic(query: string): Promise<OpenCriticSearchResult[]> {
  const result = await ocFetch<OpenCriticSearchResult[]>(
    `/game/search?criteria=${encodeURIComponent(query)}`
  );
  return result ?? [];
}

export async function getOpenCriticGame(id: number): Promise<OpenCriticGame | null> {
  return ocFetch<OpenCriticGame>(`/game/${id}`);
}

/**
 * Best-effort fetch by title: search → take top result → fetch details.
 * Returns null if anything fails or no good match found.
 */
export async function fetchOpenCriticByTitle(title: string): Promise<{
  id: number;
  score: number | null;
  tier: string | null;
  url: string | null;
} | null> {
  if (!getKey()) return null;
  const candidates = await searchOpenCritic(title);
  if (candidates.length === 0) return null;

  // First result is usually the closest match
  const top = candidates[0];
  const details = await getOpenCriticGame(top.id);
  if (!details) return null;

  return {
    id: details.id,
    score: details.topCriticScore != null ? Math.round(details.topCriticScore) : null,
    tier: details.tier ?? null,
    url: details.url ?? `https://opencritic.com/game/${top.id}`,
  };
}
