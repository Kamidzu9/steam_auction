import { describe, it, expect, beforeEach } from "vitest";
import {
  isOnboardingComplete,
  completeOnboarding,
  resetOnboarding,
} from "../lib/onboarding";

beforeEach(() => {
  localStorage.clear();
});

describe("onboarding helpers", () => {
  it("isOnboardingComplete returns false when no value is set", () => {
    expect(isOnboardingComplete()).toBe(false);
  });

  it("completeOnboarding sets the localStorage key", () => {
    completeOnboarding();
    expect(localStorage.getItem("steamAuction_onboarding_complete")).toBe(
      "true",
    );
  });

  it("isOnboardingComplete returns true after completeOnboarding", () => {
    completeOnboarding();
    expect(isOnboardingComplete()).toBe(true);
  });

  it("resetOnboarding removes the key", () => {
    completeOnboarding();
    resetOnboarding();
    expect(localStorage.getItem("steamAuction_onboarding_complete")).toBeNull();
  });

  it("isOnboardingComplete returns false after resetOnboarding", () => {
    completeOnboarding();
    resetOnboarding();
    expect(isOnboardingComplete()).toBe(false);
  });
});
