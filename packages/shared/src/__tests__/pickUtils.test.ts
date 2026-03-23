import { describe, it, expect, vi } from "vitest";
import { pickWeighted, pickByIndex } from "../pickUtils.js";

describe("pickWeighted", () => {
  it("selects item proportionally to weight (deterministic mock)", () => {
    const items = [
      { id: 1, weight: 1 },
      { id: 2, weight: 3 },
      { id: 3, weight: 6 },
    ];

    const rand = vi.spyOn(Math, "random").mockReturnValue(0.05);
    expect(pickWeighted(items).id).toBe(1);
    rand.mockReturnValue(0.2);
    expect(pickWeighted(items).id).toBe(2);
    rand.mockReturnValue(0.95);
    expect(pickWeighted(items).id).toBe(3);
    rand.mockRestore();
  });

  it("returns last item when roll equals total", () => {
    const items = [{ id: 1, weight: 1 }];
    vi.spyOn(Math, "random").mockReturnValue(1);
    expect(pickWeighted(items).id).toBe(1);
    vi.restoreAllMocks();
  });
});

describe("pickByIndex", () => {
  it("wraps around with modulo", () => {
    const items = ["a", "b", "c"];
    expect(pickByIndex(items, 0)).toBe("a");
    expect(pickByIndex(items, 3)).toBe("a");
    expect(pickByIndex(items, 4)).toBe("b");
  });
});
