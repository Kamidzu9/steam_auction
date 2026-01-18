import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSteamOpenIdUrl, getSteamBaseUrl, verifySteamOpenId } from "../lib/steam";

describe("steam helpers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("builds a valid OpenID URL", () => {
    const url = buildSteamOpenIdUrl(
      "https://example.com/api/auth/steam/callback",
      "https://example.com"
    );
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://steamcommunity.com/openid/login");
    expect(parsed.searchParams.get("openid.mode")).toBe("checkid_setup");
    expect(parsed.searchParams.get("openid.return_to")).toBe(
      "https://example.com/api/auth/steam/callback"
    );
    expect(parsed.searchParams.get("openid.realm")).toBe("https://example.com");
  });

  it("verifies OpenID response and extracts steamId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("is_valid:true\n"));
    vi.stubGlobal("fetch", fetchMock);

    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    });

    const result = await verifySteamOpenId(
      "https://example.com/api/auth/steam/callback",
      params
    );

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.steamId).toBe("76561198000000000");
    }
    expect(fetchMock).toHaveBeenCalled();
    const call = fetchMock.mock.calls[0];
    const body = call?.[1]?.body as string;
    expect(body).toContain("openid.mode=check_authentication");
  });

  it("returns invalid when OpenID verification fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("is_valid:false\n"));
    vi.stubGlobal("fetch", fetchMock);

    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    });

    const result = await verifySteamOpenId(
      "https://example.com/api/auth/steam/callback",
      params
    );

    expect(result.valid).toBe(false);
  });

  it("uses STEAM_REALM when present", async () => {
    process.env.STEAM_REALM = "https://example.com/";
    const base = await getSteamBaseUrl();
    expect(base).toBe("https://example.com");
  });
});
