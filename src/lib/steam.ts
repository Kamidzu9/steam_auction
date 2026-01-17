import { headers } from "next/headers";

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

export function buildSteamOpenIdUrl(returnTo: string, realm: string) {
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

export async function verifySteamOpenId(
  requestUrl: string,
  params: URLSearchParams
) {
  try {
    const verifyParams = new URLSearchParams(params);
    verifyParams.set("openid.mode", "check_authentication");

    const response = await fetch(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "text/plain, */*",
      },
      body: verifyParams.toString(),
      cache: "no-store",
    });

    const text = await response.text();
    const isValid = text.includes("is_valid:true");

    if (!isValid) {
      return { valid: false as const };
    }

    // Steam may return either openid.claimed_id or openid.identity
    const claimedId = params.get("openid.claimed_id") || params.get("openid.identity") || "";

    // Try common OpenID claimed_id formats (be tolerant)
    let steamIdMatch = claimedId.match(/openid\/id\/(\d+)/);
    if (!steamIdMatch) {
      steamIdMatch = claimedId.match(/(\d{6,})/); // fallback: any long number in the URL
    }

    if (!steamIdMatch) {
      return { valid: false as const };
    }

    return {
      valid: true as const,
      steamId: steamIdMatch[1],
      returnTo: requestUrl,
    };
  } catch (err) {
    return { valid: false as const };
  }
}

export async function getBaseUrl() {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  return `${proto}://${host}`;
}
