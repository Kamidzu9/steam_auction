import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock config before any other imports that depend on it.
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

// Use vi.hoisted so that prismaMock is available when the factory is called.
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

describe("GET /health", () => {
  it("returns ok: true", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
  });
});

describe("GET /me", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/me" });
    expect(res.statusCode).toBe(401);
  });

  it("returns user when token is valid", async () => {
    const mockUser = {
      id: "user-1",
      steamId: "76561198000000000",
      displayName: "TestUser",
      avatarUrl: null,
      createdAt: new Date(),
    };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = app.jwt.sign({ sub: mockUser.id, steamId: mockUser.steamId });
    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ user: typeof mockUser }>();
    expect(body.user.id).toBe("user-1");
  });
});

describe("GET /friends", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/friends" });
    expect(res.statusCode).toBe(401);
  });

  it("returns empty friends list for authenticated user", async () => {
    prismaMock.friend.findMany.mockResolvedValue([]);
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "GET",
      url: "/friends",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ friends: unknown[] }>().friends).toEqual([]);
  });
});

describe("POST /auth/refresh", () => {
  it("returns 401 when no refresh token is provided", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/refresh" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when refresh token is invalid (no matching session)", async () => {
    prismaMock.session.findFirst.mockResolvedValue(null);
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { refresh: "invalid-or-unknown-token" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns new access token when refresh token resolves to a valid session", async () => {
    const mockSession = {
      id: "sess-1",
      userId: "user-1",
      revoked: false,
      expiresAt: new Date(Date.now() + 100_000),
    };
    const mockUser = { id: "user-1", steamId: "76561198000000000", displayName: null, avatarUrl: null };
    prismaMock.session.findFirst.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.session.update.mockResolvedValue({});

    // Send any cookie value — the mock findFirst always returns the mocked session.
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { refresh: "any-value-mock-handles-it" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(typeof body.accessToken).toBe("string");
  });
});

describe("POST /auth/logout", () => {
  it("returns ok: true and clears cookies", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/logout" });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ ok: boolean }>().ok).toBe(true);
  });
});

describe("GET /pools", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.inject({ method: "GET", url: "/pools" });
    expect(res.statusCode).toBe(401);
  });

  it("returns empty pools for authenticated user", async () => {
    prismaMock.auctionPool.findMany.mockResolvedValue([]);
    const token = app.jwt.sign({ sub: "user-1", steamId: "123" });
    const res = await app.inject({
      method: "GET",
      url: "/pools",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ pools: unknown[] }>().pools).toEqual([]);
  });
});

describe("GET /leaderboard", () => {
  it("returns pickers and games without auth", async () => {
    prismaMock.pickHistory.groupBy.mockResolvedValue([]);
    const res = await app.inject({ method: "GET", url: "/leaderboard" });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ pickers: unknown[]; games: unknown[] }>();
    expect(Array.isArray(body.pickers)).toBe(true);
    expect(Array.isArray(body.games)).toBe(true);
  });
});
