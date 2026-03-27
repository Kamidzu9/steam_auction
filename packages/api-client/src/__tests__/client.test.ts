import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, ApiError } from "../client.js";

// ── ApiError ─────────────────────────────────────────────────────────────────

describe("ApiError", () => {
  it("stores status and message", () => {
    const err = new ApiError("Not Found", 404);
    expect(err.message).toBe("Not Found");
    expect(err.status).toBe(404);
    expect(err.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    expect(new ApiError("err", 500)).toBeInstanceOf(Error);
  });
});

// ── ApiClient constructor ────────────────────────────────────────────────────

describe("ApiClient constructor", () => {
  it("strips trailing slash from baseUrl", () => {
    const client = new ApiClient({ baseUrl: "http://localhost:3001/" });
    expect(client.steamLoginUrl).toBe("http://localhost:3001/auth/steam");
  });

  it("exposes steamLoginUrl", () => {
    const client = new ApiClient({ baseUrl: "http://api.example.com" });
    expect(client.steamLoginUrl).toBe("http://api.example.com/auth/steam");
  });

  it("includes a dashboard redirect when running in a browser", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "tauri://localhost",
      },
    });

    const client = new ApiClient({ baseUrl: "http://127.0.0.1:3001" });
    const loginUrl = new URL(client.steamLoginUrl);

    expect(loginUrl.origin + loginUrl.pathname).toBe("http://127.0.0.1:3001/auth/steam");
    expect(loginUrl.searchParams.get("redirectTo")).toBe("http://tauri.localhost/dashboard");

    vi.unstubAllGlobals();
  });
});

// ── fetch helper ─────────────────────────────────────────────────────────────

describe("ApiClient fetch behavior", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends Authorization header when access token is provided", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const client = new ApiClient({
      baseUrl: "http://api.example.com",
      getAccessToken: () => "my-token",
    });

    await client.getMe();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.example.com/me");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer my-token",
    );
  });

  it("does not send Authorization header when no token", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ user: null }), { status: 200 }),
    );

    const client = new ApiClient({ baseUrl: "http://api.example.com" });
    await client.getMe();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>)["Authorization"],
    ).toBeUndefined();
  });

  it("includes credentials: include in every request", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    const client = new ApiClient({ baseUrl: "http://api.example.com" });
    await client.getMe();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
  });

  it("throws ApiError for non-OK responses", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Not Found" }), { status: 404 }),
      ),
    );

    const client = new ApiClient({ baseUrl: "http://api.example.com" });
    const err = await client.getMe().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(404);
    expect((err as ApiError).message).toBe("Not Found");
  });

  it("falls back to generic message when error body has no .error field", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    const client = new ApiClient({ baseUrl: "http://api.example.com" });
    await expect(client.getMe()).rejects.toMatchObject({ status: 500 });
  });

  it("retries after 401 when onRefresh returns a new token", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: "u1" } }), { status: 200 }),
      );

    const onRefresh = vi.fn().mockResolvedValue("new-token");
    const client = new ApiClient({
      baseUrl: "http://api.example.com",
      getAccessToken: () => "old-token",
      onRefresh,
    });

    const result = await client.getMe();
    expect(result).toEqual({ user: { id: "u1" } });
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("calls onAuthFailure and throws when 401 and refresh returns null", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const onRefresh = vi.fn().mockResolvedValue(null);
    const onAuthFailure = vi.fn();
    const client = new ApiClient({
      baseUrl: "http://api.example.com",
      onRefresh,
      onAuthFailure,
    });

    await expect(client.getMe()).rejects.toThrow(ApiError);
    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it("does not retry a second 401 (no infinite loop)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const onRefresh = vi.fn().mockResolvedValue("new-token");
    const client = new ApiClient({
      baseUrl: "http://api.example.com",
      onRefresh,
    });

    await expect(client.getMe()).rejects.toThrow(ApiError);
    // Attempted original + one retry = 2 total
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ── API methods ───────────────────────────────────────────────────────────────

describe("ApiClient methods", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: ApiClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    client = new ApiClient({ baseUrl: "http://api.example.com" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("logout sends POST /auth/logout", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await client.logout();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.example.com/auth/logout");
    expect(init.method).toBe("POST");
  });

  it("refresh sends POST /auth/refresh", async () => {
    const mockTokens = {
      accessToken: "tok",
      expiresIn: 900,
      user: { id: "u1" },
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockTokens), { status: 200 }),
    );
    const result = await client.refresh();
    expect(result.accessToken).toBe("tok");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.example.com/auth/refresh");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("does not recurse refresh on 401 from /auth/refresh", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const onAuthFailure = vi.fn();
    const clientWithRefresh = new ApiClient({
      baseUrl: "http://api.example.com",
      onRefresh: async () => clientWithRefresh.refresh().then((r) => r.accessToken),
      onAuthFailure,
    });

    await expect(clientWithRefresh.refresh()).rejects.toThrow(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it("getPools sends GET /pools", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ pools: [] }), { status: 200 }),
    );
    await client.getPools();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("http://api.example.com/pools");
  });

  it("createPool sends POST /pools with body", async () => {
    const mockPool = { id: "p1", name: "My Pool" };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ pool: mockPool }), { status: 200 }),
    );
    await client.createPool({ friendId: "f1", name: "My Pool" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.example.com/pools");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      friendId: "f1",
      name: "My Pool",
    });
  });

  it("pickFromPool sends POST /pools/:id/pick", async () => {
    const mockPick = {
      pick: { id: "g1", appId: 730, name: "CS2", storeUrl: "" },
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(mockPick), { status: 200 }),
    );
    const result = await client.pickFromPool("pool-1", {});
    expect(result.pick.appId).toBe(730);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("http://api.example.com/pools/pool-1/pick");
  });

  it("getOwnedGames sends GET /steam/owned-games with steamId query param", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ games: [] }), { status: 200 }),
    );
    await client.getOwnedGames("76561198000000000");
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/steam/owned-games");
    expect(url).toContain("steamId=76561198000000000");
  });

  it("getRecentPicks sends GET /pools/:id/recent-picks with limit", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ appIds: [730] }), { status: 200 }),
    );
    const result = await client.getRecentPicks("pool-1", 5);
    expect(result.appIds).toEqual([730]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(
      "http://api.example.com/pools/pool-1/recent-picks?limit=5",
    );
  });

  it("addGameToPool detects skipped response", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ skipped: true, reason: "forbidden_word" }),
        { status: 200 },
      ),
    );
    const result = await client.addGameToPool("pool-1", {
      appId: 999,
      name: "Bad Game",
    });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("forbidden_word");
  });

  it("getSystemStatus sends GET /system/status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ configured: true, hasSteamApiKey: true }), {
        status: 200,
      }),
    );

    const result = await client.getSystemStatus();
    expect(result).toEqual({ configured: true, hasSteamApiKey: true });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("http://api.example.com/system/status");
  });

  it("configureSystem sends POST /system/config with body", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    const result = await client.configureSystem({
      apiKey: "steam-key",
      realm: "https://app.example.com",
    });

    expect(result).toEqual({ success: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.example.com/system/config");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      apiKey: "steam-key",
      realm: "https://app.example.com",
    });
  });
});
