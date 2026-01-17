import { describe, it, expect, vi } from "vitest";
import { pickWeighted } from "../lib/pickUtils";

describe("pickWeighted", () => {
  it("selects item proportionally to weight (deterministic mock)", () => {
    const items = [
      { id: 1, weight: 1 },
      { id: 2, weight: 3 },
      { id: 3, weight: 6 },
    ];

    // mock Math.random to return small, medium, large values
    const rand = vi.spyOn(Math, "random").mockReturnValue(0.05);
    expect(pickWeighted(items).id).toBe(1);
    rand.mockReturnValue(0.2);
    expect(pickWeighted(items).id).toBe(2);
    rand.mockReturnValue(0.95);
    expect(pickWeighted(items).id).toBe(3);
    rand.mockRestore();
  });
});
