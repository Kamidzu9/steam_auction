type SteamJson = Record<string, unknown>;

const BASE_URL = "https://api.steampowered.com";

export async function fetchSteam<T = SteamJson>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    return { ok: false as const, status: response.status, text };
  }
  const data = (await response.json()) as T;
  return { ok: true as const, data };
}

export async function resolveSteamId(steamIdOrVanity: string, apiKey: string) {
  if (/^\d{17}$/.test(steamIdOrVanity)) {
    return { ok: true as const, steamId: steamIdOrVanity };
  }

  const url = new URL(`${BASE_URL}/ISteamUser/ResolveVanityURL/v0001/`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", steamIdOrVanity);

  const result = await fetchSteam<{ response: { success: number; steamid?: string } }>(
    url.toString()
  );

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

  return fetchSteam<{ response: { players: Array<{ steamid: string; personaname: string; avatarfull: string }> } }>(
    url.toString()
  );
}
