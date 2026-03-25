type SteamJson = Record<string, unknown>;

const BASE_URL = "https://api.steampowered.com";

// Simple per-process cache; cleared on restart and not shared across instances.
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

export async function fetchSteam<T = SteamJson>(url: string, useCache = true) {
  if (useCache) {
    const cached = getCached<T>(url);
    if (cached) return { ok: true as const, data: cached };
  }

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    return { ok: false as const, status: response.status, text };
  }
  const data = (await response.json()) as T;

  if (useCache) {
    setCache(url, data);
  }

  return { ok: true as const, data };
}

export async function resolveSteamId(steamIdOrVanity: string, apiKey: string) {
  if (/^\d{17}$/.test(steamIdOrVanity)) {
    return { ok: true as const, steamId: steamIdOrVanity };
  }

  const url = new URL(`${BASE_URL}/ISteamUser/ResolveVanityURL/v0001/`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", steamIdOrVanity);

  const result = await fetchSteam<{
    response: { success: number; steamid?: string };
  }>(url.toString());

  if (!result.ok) {
    return { ok: false as const, error: "Failed to resolve Steam vanity URL" };
  }

  if (result.data.response.success !== 1 || !result.data.response.steamid) {
    return { ok: false as const, error: "Invalid SteamID or vanity name" };
  }

  return { ok: true as const, steamId: result.data.response.steamid };
}

export async function getPlayerSummaries(steamIds: string[], apiKey: string) {
  const url = new URL(`${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", steamIds.join(","));

  return fetchSteam<{
    response: {
      players: Array<{
        steamid: string;
        personaname: string;
        avatarfull: string;
      }>;
    };
  }>(url.toString());
}
