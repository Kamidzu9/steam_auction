import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../config.js", () => ({
  config: {
    NODE_ENV: "test",
    PORT: 3001,
    DATABASE_URL: "file:./test.db",
    JWT_SECRET: "test-secret-that-is-at-least-32-characters-long!!",
    JWT_ACCESS_EXPIRES_IN: "15m",
    REFRESH_EXPIRES_DAYS: 30,
    STEAM_API_KEY: undefined,
    STEAM_REALM: undefined,
    FRONTEND_URL: "http://localhost:3000",
    COOKIE_SECURE: false,
  },
}));

const prismaMock = vi.hoisted(() => ({
  session: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  user: { findUnique: vi.fn(), upsert: vi.fn() },
  friend: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  auctionPool: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn() },
  pickHistory: { groupBy: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  game: { findUnique: vi.fn(), upsert: vi.fn() },
  poolGame: { upsert: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@steam-auction/db", () => ({
  prisma: prismaMock,
  PrismaClient: vi.fn(),
}));

import { buildApp } from "../server.js";

let app: Awaited<ReturnType<typeof buildApp>>;

beforeEach(async () => {
  vi.clearAllMocks();
  app = await buildApp();
});

afterEach(async () => {
  await app.close();
});

// ── POST /pools ─────────────────────────────────────────────────────────────

describe("POST /pools", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "POST", url: "/pools", payload: { friendId: "f1" } });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools",
      headers: { Authorization: `Bearer ${token}` },
      payload: { friendId: "" }, // empty friendId → invalid
    });
    expect(res.statusCode).toBe(400);
  });

  it("creates a pool and returns 201", async () => {
    const mockPool = { id: "pool-1", ownerId: "user-1", friendId: "f1", name: "Test Pool", createdAt: new Date() };
    prismaMock.auctionPool.create.mockResolvedValue(mockPool);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools",
      headers: { Authorization: `Bearer ${token}` },
      payload: { friendId: "f1", name: "Test Pool" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{ pool: typeof mockPool }>();
    expect(body.pool.id).toBe("pool-1");
    expect(body.pool.name).toBe("Test Pool");
  });

  it("uses default pool name when name is omitted", async () => {
    const mockPool = { id: "pool-2", ownerId: "user-1", friendId: "f1", name: "Auction Pool", createdAt: new Date() };
    prismaMock.auctionPool.create.mockResolvedValue(mockPool);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    await app.inject({
      method: "POST",
      url: "/pools",
      headers: { Authorization: `Bearer ${token}` },
      payload: { friendId: "f1" },
    });

    const callArgs = prismaMock.auctionPool.create.mock.calls[0][0];
    expect(callArgs.data.name).toBe("Auction Pool");
  });
});

// ── POST /pools/:poolId/games ────────────────────────────────────────────────

describe("POST /pools/:poolId/games", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/games",
      payload: { appId: 730, name: "Counter-Strike 2" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 404 when pool is not found or belongs to another user", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue(null);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/nonexistent/games",
      headers: { Authorization: `Bearer ${token}` },
      payload: { appId: 730, name: "Counter-Strike 2" },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for invalid body", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue({ id: "pool-1", ownerId: "user-1" });

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/games",
      headers: { Authorization: `Bearer ${token}` },
      payload: { appId: -1, name: "" }, // invalid
    });

    expect(res.statusCode).toBe(400);
  });

  it("skips game with a forbidden word in name", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue({ id: "pool-1", ownerId: "user-1" });

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/games",
      headers: { Authorization: `Bearer ${token}` },
      payload: { appId: 999, name: "XXX Adventures" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ skipped: boolean; reason: string }>();
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("forbidden_word");
    // The game was rejected so upsert should not have been called
    expect(prismaMock.game.upsert).not.toHaveBeenCalled();
  });

  it("adds game to pool and returns poolGame", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue({ id: "pool-1", ownerId: "user-1" });
    const mockGame = { id: "game-1", appId: 730, name: "Counter-Strike 2", storeUrl: "https://store.steampowered.com/app/730" };
    const mockPoolGame = { poolId: "pool-1", gameId: "game-1", weight: 1 };
    prismaMock.game.upsert.mockResolvedValue(mockGame);
    prismaMock.poolGame.upsert.mockResolvedValue(mockPoolGame);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/games",
      headers: { Authorization: `Bearer ${token}` },
      payload: { appId: 730, name: "Counter-Strike 2" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ poolGame: typeof mockPoolGame }>();
    expect(body.poolGame.poolId).toBe("pool-1");
  });
});

// ── POST /pools/:poolId/pick ─────────────────────────────────────────────────

describe("POST /pools/:poolId/pick", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "POST", url: "/pools/pool-1/pick" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 404 when pool is not found", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue(null);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/nonexistent/pick",
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when pool has no games", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue({
      id: "pool-1",
      ownerId: "user-1",
      games: [],
    });

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/pick",
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toMatch(/empty/i);
  });

  it("picks a game from a non-empty pool", async () => {
    const mockGame = { id: "game-1", appId: 730, name: "Counter-Strike 2", storeUrl: "https://store.steampowered.com/app/730" };
    prismaMock.auctionPool.findFirst.mockResolvedValue({
      id: "pool-1",
      ownerId: "user-1",
      games: [{ gameId: "game-1", weight: 1, game: mockGame }],
    });
    prismaMock.pickHistory.create.mockResolvedValue({});

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/pick",
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ pick: { appId: number; name: string } }>();
    expect(body.pick.appId).toBe(730);
    expect(body.pick.name).toBe("Counter-Strike 2");
    expect(prismaMock.pickHistory.create).toHaveBeenCalledOnce();
  });

  it("filters candidates by appIds when provided", async () => {
    const game1 = { id: "g1", appId: 730, name: "CS2", storeUrl: "https://store.steampowered.com/app/730" };
    const game2 = { id: "g2", appId: 570, name: "Dota 2", storeUrl: "https://store.steampowered.com/app/570" };
    prismaMock.auctionPool.findFirst.mockResolvedValue({
      id: "pool-1",
      ownerId: "user-1",
      games: [
        { gameId: "g1", weight: 1, game: game1 },
        { gameId: "g2", weight: 1, game: game2 },
      ],
    });
    prismaMock.pickHistory.create.mockResolvedValue({});

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/pick",
      headers: { Authorization: `Bearer ${token}` },
      payload: { appIds: [570] }, // only Dota 2
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ pick: { appId: number } }>();
    expect(body.pick.appId).toBe(570);
  });

  it("uses avoid mode to filter recent picks", async () => {
    const mockGame = { id: "game-1", appId: 730, name: "Counter-Strike 2", storeUrl: "https://store.steampowered.com/app/730" };
    prismaMock.auctionPool.findFirst.mockResolvedValue({
      id: "pool-1",
      ownerId: "user-1",
      games: [{ gameId: "game-1", weight: 1, game: mockGame }],
    });
    // Recent pick history returns game-1, but since it's the only candidate,
    // the filter falls back to all candidates.
    prismaMock.pickHistory.findMany.mockResolvedValue([{ gameId: "game-1" }]);
    prismaMock.pickHistory.create.mockResolvedValue({});

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/pick",
      headers: { Authorization: `Bearer ${token}` },
      payload: { mode: "avoid", avoidCount: 1 },
    });

    // Pool has only 1 game, so even with avoid mode we still pick it
    expect(res.statusCode).toBe(200);
  });

  it("returns 400 for invalid pick body", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/pools/pool-1/pick",
      headers: { Authorization: `Bearer ${token}` },
      payload: { mode: "invalid-mode" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── GET /pools/:poolId/recent-picks ─────────────────────────────────────────

describe("GET /pools/:poolId/recent-picks", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/pools/pool-1/recent-picks" });
    expect(res.statusCode).toBe(401);
  });

  it("returns empty appIds when limit is 0 or missing", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "GET",
      url: "/pools/pool-1/recent-picks",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ appIds: number[] }>().appIds).toEqual([]);
  });

  it("returns 404 when pool is not found", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue(null);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "GET",
      url: "/pools/nonexistent/recent-picks?limit=5",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns recent pick appIds for valid pool", async () => {
    prismaMock.auctionPool.findFirst.mockResolvedValue({ id: "pool-1", ownerId: "user-1" });
    prismaMock.pickHistory.findMany.mockResolvedValue([
      { game: { appId: 730 } },
      { game: { appId: 570 } },
    ]);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "GET",
      url: "/pools/pool-1/recent-picks?limit=5",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ appIds: number[] }>();
    expect(body.appIds).toEqual([730, 570]);
  });
});
