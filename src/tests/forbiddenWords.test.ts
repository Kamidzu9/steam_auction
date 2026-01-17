import { describe, it, expect } from "vitest";
import { forbiddenWords } from "../config/forbiddenWords";

describe("forbiddenWords list", () => {
  it("contains words and matches case-insensitively", () => {
    expect(forbiddenWords.length).toBeGreaterThan(0);
    const regex = new RegExp(`\\b(${forbiddenWords.map(w => w.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
    expect(regex.test('This is porn game')).toBe(true);
    expect(regex.test('No forbidden here')).toBe(false);
  });
});
