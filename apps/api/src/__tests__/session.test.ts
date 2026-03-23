import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the db package before importing session module.
const prismaMock = {
  session: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock("@steam-auction/db", () => ({
  prisma: prismaMock,
}));

// Mock config to avoid needing actual env vars.
vi.mock("../config.js", () => ({
  config: {
    NODE_ENV: "test",
    REFRESH_EXPIRES_DAYS: 30,
    JWT_SECRET: "test-secret-at-least-32-chars-long!!",
    JWT_ACCESS_EXPIRES_IN: "15m",
    PORT: 3001,
    FRONTEND_URL: "http://localhost:3000",
    COOKIE_SECURE: false,
  },
}));

let createSession: typeof import("../lib/session.js").createSession;
let validateRefreshToken: typeof import("../lib/session.js").validateRefreshToken;
let rotateRefreshToken: typeof import("../lib/session.js").rotateRefreshToken;
let revokeSession: typeof import("../lib/session.js").revokeSession;

beforeEach(async () => {
  vi.resetModules();
  ({ createSession, validateRefreshToken, rotateRefreshToken, revokeSession } =
    await import("../lib/session.js"));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  it("creates a session and returns sessionId + refreshToken", async () => {
    const mockSession = { id: "sess-1" };
    prismaMock.session.create.mockResolvedValue(mockSession);

    const result = await createSession("user-1");

    expect(prismaMock.session.create).toHaveBeenCalledOnce();
    expect(result.sessionId).toBe("sess-1");
    expect(typeof result.refreshToken).toBe("string");
    expect(result.refreshToken.length).toBeGreaterThan(0);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});

describe("validateRefreshToken", () => {
  it("returns null when token is undefined", async () => {
    const result = await validateRefreshToken(undefined);
    expect(result).toBeNull();
  });

  it("returns null when session not found", async () => {
    prismaMock.session.findFirst.mockResolvedValue(null);
    const result = await validateRefreshToken("some-token");
    expect(result).toBeNull();
  });

  it("returns null when session is expired", async () => {
    prismaMock.session.findFirst.mockResolvedValue({
      id: "s1",
      userId: "u1",
      revoked: false,
      expiresAt: new Date(Date.now() - 1000),
    });
    const result = await validateRefreshToken("some-token");
    expect(result).toBeNull();
  });

  it("returns session + user for a valid token", async () => {
    const mockSession = {
      id: "s1",
      userId: "u1",
      revoked: false,
      expiresAt: new Date(Date.now() + 100_000),
    };
    const mockUser = { id: "u1", steamId: "123" };
    prismaMock.session.findFirst.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await validateRefreshToken("valid-token");
    expect(result).not.toBeNull();
    expect(result?.session.id).toBe("s1");
    expect(result?.user.id).toBe("u1");
  });
});

describe("rotateRefreshToken", () => {
  it("updates the session and returns new token + expiry", async () => {
    prismaMock.session.update.mockResolvedValue({});

    const result = await rotateRefreshToken("sess-1");

    expect(prismaMock.session.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "sess-1" } })
    );
    expect(typeof result.refreshToken).toBe("string");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});

describe("revokeSession", () => {
  it("marks the session as revoked", async () => {
    prismaMock.session.updateMany.mockResolvedValue({ count: 1 });
    await revokeSession("sess-1");
    expect(prismaMock.session.updateMany).toHaveBeenCalledWith({
      where: { id: "sess-1" },
      data: { revoked: true },
    });
  });
});
