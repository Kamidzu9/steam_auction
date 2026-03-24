import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("RootLayout BottomNav visibility", () => {
  it("always shows BottomNav regardless of auth state", async () => {
    // Mock next/font/google used in layout during tests
    vi.doMock("next/font/google", () => ({ Manrope: () => ({ variable: "" }), Space_Grotesk: () => ({ variable: "" }) }));
    // Stub BottomNav (client component) to avoid client-only hooks in server render
    vi.doMock("../components/BottomNav", () => ({ default: () => (<nav aria-label="Primary" />) }));
    const { default: RootLayout } = await import("../app/layout");

    const element = RootLayout({ children: <div>child</div> });
    const html = renderToStaticMarkup(element as React.ReactElement);
    expect(html.includes('aria-label="Primary"')).toBe(true);
  });

  it("renders children inside main element", async () => {
    vi.doMock("next/font/google", () => ({ Manrope: () => ({ variable: "" }), Space_Grotesk: () => ({ variable: "" }) }));
    vi.doMock("../components/BottomNav", () => ({ default: () => null }));
    const { default: RootLayout } = await import("../app/layout");

    const element = RootLayout({ children: <div id="test-child">child</div> });
    const html = renderToStaticMarkup(element as React.ReactElement);
    expect(html.includes('id="test-child"')).toBe(true);
  });
});
