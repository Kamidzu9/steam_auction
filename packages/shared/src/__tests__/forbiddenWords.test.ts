import { describe, it, expect } from "vitest";
import { forbiddenWords, forbiddenRegex } from "../config/forbiddenWords.js";

describe("forbiddenWords", () => {
  it("is a non-empty array", () => {
    expect(forbiddenWords.length).toBeGreaterThan(0);
  });

  it("matches forbidden words case-insensitively", () => {
    expect(forbiddenRegex?.test("This is porn game")).toBe(true);
    expect(forbiddenRegex?.test("XXX Adventures")).toBe(true);
    expect(forbiddenRegex?.test("No forbidden here")).toBe(false);
  });

  it("matches only whole words", () => {
    expect(forbiddenRegex?.test("sexpected behavior")).toBe(false);
  });
});
