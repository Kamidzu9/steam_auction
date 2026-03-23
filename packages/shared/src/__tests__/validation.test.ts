import { describe, it, expect } from "vitest";
import {
  createPoolSchema,
  addGameSchema,
  pickGameSchema,
  addFriendSchema,
  bulkAddFriendsSchema,
  limitSchema,
} from "../validation.js";

describe("createPoolSchema", () => {
  it("accepts valid input", () => {
    expect(createPoolSchema.safeParse({ friendId: "abc", name: "Test Pool" }).success).toBe(true);
  });

  it("requires friendId", () => {
    expect(createPoolSchema.safeParse({ friendId: "" }).success).toBe(false);
  });

  it("allows name to be omitted", () => {
    expect(createPoolSchema.safeParse({ friendId: "abc" }).success).toBe(true);
  });
});

describe("addGameSchema", () => {
  it("accepts valid input", () => {
    const input = { appId: 730, name: "Counter-Strike 2" };
    expect(addGameSchema.safeParse(input).success).toBe(true);
  });

  it("rejects negative appId", () => {
    expect(addGameSchema.safeParse({ appId: -1, name: "Test" }).success).toBe(false);
  });

  it("rejects empty name", () => {
    expect(addGameSchema.safeParse({ appId: 1, name: "" }).success).toBe(false);
  });
});

describe("pickGameSchema", () => {
  it("accepts empty object", () => {
    expect(pickGameSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid avoid mode", () => {
    expect(pickGameSchema.safeParse({ mode: "avoid", avoidCount: 3 }).success).toBe(true);
  });

  it("rejects invalid mode", () => {
    expect(pickGameSchema.safeParse({ mode: "random" }).success).toBe(false);
  });
});

describe("limitSchema", () => {
  it("coerces string to number", () => {
    const result = limitSchema.safeParse("10");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(10);
  });

  it("defaults to 0", () => {
    const result = limitSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });

  it("rejects values over 50", () => {
    expect(limitSchema.safeParse(51).success).toBe(false);
  });
});

describe("addFriendSchema", () => {
  it("accepts valid steamId", () => {
    expect(addFriendSchema.safeParse({ steamId: "76561198000000000" }).success).toBe(true);
  });

  it("rejects empty steamId", () => {
    expect(addFriendSchema.safeParse({ steamId: "" }).success).toBe(false);
  });
});

describe("bulkAddFriendsSchema", () => {
  it("accepts empty friends array", () => {
    expect(bulkAddFriendsSchema.safeParse({ friends: [] }).success).toBe(true);
  });

  it("accepts valid friends array", () => {
    const input = { friends: [{ steamId: "123", displayName: "Alice" }] };
    expect(bulkAddFriendsSchema.safeParse(input).success).toBe(true);
  });
});
