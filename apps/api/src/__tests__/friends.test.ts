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

// ── GET /friends ─────────────────────────────────────────────────────────────

describe("GET /friends", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/friends" });
    expect(res.statusCode).toBe(401);
  });

  it("returns friends list for authenticated user", async () => {
    const mockFriend = { id: "f1", userId: "user-1", steamId: "111", displayName: "Alice", createdAt: new Date() };
    prismaMock.friend.findMany.mockResolvedValue([mockFriend]);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "GET",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ friends: typeof mockFriend[] }>();
    expect(body.friends).toHaveLength(1);
    expect(body.friends[0].displayName).toBe("Alice");
  });
});

// ── POST /friends ─────────────────────────────────────────────────────────────

describe("POST /friends", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "POST", url: "/friends", payload: { steamId: "111" } });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
      payload: { steamId: "" }, // empty steamId → invalid
    });
    expect(res.statusCode).toBe(400);
  });

  it("creates a friend and returns 201", async () => {
    const mockFriend = { id: "f1", userId: "user-1", steamId: "111", displayName: "Alice", createdAt: new Date() };
    prismaMock.friend.upsert.mockResolvedValue(mockFriend);

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
      payload: { steamId: "111", displayName: "Alice" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json<{ friend: typeof mockFriend }>();
    expect(body.friend.steamId).toBe("111");
    expect(body.friend.displayName).toBe("Alice");
  });

  it("upserts friend with correct userId from token", async () => {
    prismaMock.friend.upsert.mockResolvedValue({ id: "f1", userId: "user-2", steamId: "999", displayName: null });

    const token = app.jwt.sign({ sub: "user-2", steamId: "456" });
    await app.inject({
      method: "POST",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
      payload: { steamId: "999" },
    });

    const upsertCall = prismaMock.friend.upsert.mock.calls[0][0];
    expect(upsertCall.create.userId).toBe("user-2");
  });
});

// ── POST /friends/bulk ────────────────────────────────────────────────────────

describe("POST /friends/bulk", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "POST", url: "/friends/bulk", payload: { friends: [] } });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/friends/bulk",
      headers: { Authorization: `Bearer ${token}` },
      payload: { friends: "not-an-array" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns ok: true with count 0 for empty friends array", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/friends/bulk",
      headers: { Authorization: `Bearer ${token}` },
      payload: { friends: [] },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ ok: boolean; count: number }>();
    expect(body.ok).toBe(true);
    expect(body.count).toBe(0);
  });

  it("bulk-adds multiple friends in a transaction", async () => {
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.friend.upsert.mockResolvedValue({});

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "POST",
      url: "/friends/bulk",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        friends: [
          { steamId: "111", displayName: "Alice" },
          { steamId: "222", displayName: "Bob" },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ ok: boolean; count: number }>();
    expect(body.ok).toBe(true);
    expect(body.count).toBe(2);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });
});

// ── DELETE /friends ───────────────────────────────────────────────────────────

describe("DELETE /friends", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "DELETE", url: "/friends", payload: { id: "f1" } });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when neither id nor steamId is provided", async () => {
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "DELETE",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("deletes friend by id", async () => {
    prismaMock.friend.deleteMany.mockResolvedValue({ count: 1 });

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "DELETE",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
      payload: { id: "f1" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
    expect(prismaMock.friend.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "f1", userId: "user-1" } })
    );
  });

  it("deletes friend by steamId", async () => {
    prismaMock.friend.deleteMany.mockResolvedValue({ count: 1 });

    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "DELETE",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
      payload: { steamId: "111" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
    expect(prismaMock.friend.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { steamId: "111", userId: "user-1" } })
    );
  });
});
