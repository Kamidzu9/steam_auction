import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildSteamOpenIdUrl, verifySteamOpenId, getSteamBaseUrl } from "../lib/steam.js";

describe("Steam OpenID helpers", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("builds a valid OpenID URL with correct params", () => {
    const url = buildSteamOpenIdUrl(
      "https://example.com/auth/steam/callback",
      "https://example.com"
    );
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://steamcommunity.com/openid/login");
    expect(parsed.searchParams.get("openid.mode")).toBe("checkid_setup");
    expect(parsed.searchParams.get("openid.return_to")).toBe(
      "https://example.com/auth/steam/callback"
    );
    expect(parsed.searchParams.get("openid.realm")).toBe("https://example.com");
  });

  it("verifies a valid Steam OpenID response and extracts steamId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("is_valid:true\n"));
    vi.stubGlobal("fetch", fetchMock);

    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    });

    const result = await verifySteamOpenId(params);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.steamId).toBe("76561198000000000");
    }

    const call = fetchMock.mock.calls[0];
    const body = call?.[1]?.body as string;
    expect(body).toContain("openid.mode=check_authentication");
  });

  it("returns invalid when Steam says is_valid:false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("is_valid:false\n")));
    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    });
    const result = await verifySteamOpenId(params);
    expect(result.valid).toBe(false);
  });

  it("returns invalid when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    });
    const result = await verifySteamOpenId(params);
    expect(result.valid).toBe(false);
  });

  it("uses STEAM_REALM env var for base URL", () => {
    process.env.STEAM_REALM = "https://myapp.example.com/";
    const base = getSteamBaseUrl("http://localhost:3001/auth/steam");
    expect(base).toBe("https://myapp.example.com");
  });

  it("derives base URL from request URL when no env var is set", () => {
    delete process.env.STEAM_REALM;
    delete process.env.API_URL;
    delete process.env.APP_URL;
    const base = getSteamBaseUrl("https://api.example.com/auth/steam");
    expect(base).toBe("https://api.example.com");
  });
});
