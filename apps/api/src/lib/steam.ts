const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function buildSteamOpenIdUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export async function verifySteamOpenId(params: URLSearchParams): Promise<
  { valid: false } | { valid: true; steamId: string }
> {
  try {
    const verifyParams = new URLSearchParams(params);
    verifyParams.set("openid.mode", "check_authentication");

    const response = await fetch(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/plain, */*",
      },
      body: verifyParams.toString(),
    });

    const text = await response.text();
    if (!text.includes("is_valid:true")) {
      return { valid: false };
    }

    const claimedId =
      params.get("openid.claimed_id") ?? params.get("openid.identity") ?? "";

    let match = claimedId.match(/openid\/id\/(\d+)/);
    if (!match) {
      match = claimedId.match(/(\d{6,})/);
    }

    if (!match) {
      return { valid: false };
    }

    return { valid: true, steamId: match[1]! };
  } catch {
    return { valid: false };
  }
}

export function getSteamBaseUrl(requestUrl: string): string {
  const envUrl =
    process.env.STEAM_REALM ??
    process.env.API_URL ??
    process.env.APP_URL;

  if (envUrl) return normalizeBaseUrl(envUrl);

  const url = new URL(requestUrl);
  return normalizeBaseUrl(`${url.protocol}//${url.host}`);
}
