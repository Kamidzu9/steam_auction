import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mocks must be registered before importing the module under test.
const cookiesMock = { get: vi.fn(), set: vi.fn() };
vi.mock("next/headers", () => ({ cookies: () => cookiesMock }));

const prismaMock = {
  session: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  user: { findUnique: vi.fn() },
};
vi.mock("../lib/prisma", () => ({ prisma: prismaMock }));

let isAuthenticated: typeof import("../lib/session").isAuthenticated;

beforeEach(async () => {
  vi.resetModules();
  // re-import after mocks
  ({ isAuthenticated } = await import("../lib/session"));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("isAuthenticated helper (refresh flow)", () => {
  it("returns false when no cookies are set", async () => {
    cookiesMock.get.mockImplementation(() => undefined);
    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it("returns false when sid present but session not found", async () => {
    cookiesMock.get.mockImplementation((name: string) => (name === "sid" ? { value: "s1" } : undefined));
    prismaMock.session.findUnique.mockResolvedValue(null);
    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it("returns true when sid present and session valid", async () => {
    const fakeSession = { id: "s1", userId: "u1", revoked: false, expiresAt: new Date(Date.now() + 10000) };
    cookiesMock.get.mockImplementation((name: string) => (name === "sid" ? { value: "s1" } : undefined));
    prismaMock.session.findUnique.mockResolvedValue(fakeSession);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", displayName: "Test" });
    const result = await isAuthenticated();
    expect(result).toBe(true);
  });

  it("rotates refresh token when sid missing but refresh valid", async () => {
    const fakeSession = { id: "s2", userId: "u2", revoked: false, expiresAt: new Date(Date.now() + 10000) };
    cookiesMock.get.mockImplementation((name: string) => (name === "refresh" ? { value: "rtoken" } : undefined));
    prismaMock.session.findFirst.mockResolvedValue(fakeSession);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u2", displayName: "Test2" });
    prismaMock.session.update.mockResolvedValue({});

    const result = await isAuthenticated();
    expect(result).toBe(true);
    expect(cookiesMock.set).toHaveBeenCalled();
  });
});
