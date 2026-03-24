import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock next/navigation before importing the component
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

// Mock next/link as a simple anchor element
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import BottomNav from "../components/BottomNav";
import { usePathname } from "next/navigation";

const mockUsePathname = vi.mocked(usePathname);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BottomNav", () => {
  it("always renders the navigation regardless of auth state", () => {
    const { container } = render(<BottomNav />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders the navigation element", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation", { name: /primary/i })).not.toBeNull();
  });

  it("renders all expected navigation links", () => {
    render(<BottomNav />);

    const expectedLabels = ["Home", "Dashboard", "Pools", "Library", "Friends", "Profile"];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).not.toBeNull();
    }
  });

  it("sets aria-current='page' on the active route link", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<BottomNav />);

    const activeLink = screen.getByText("Dashboard").closest("a");
    expect(activeLink?.getAttribute("aria-current")).toBe("page");
  });

  it("does not set aria-current on inactive links", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<BottomNav />);

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.getAttribute("aria-current")).toBeNull();
  });

  it("marks /pools/* as active when on a pool detail page", () => {
    mockUsePathname.mockReturnValue("/pools/abc-123");
    render(<BottomNav />);

    const poolsLink = screen.getByText("Pools").closest("a");
    expect(poolsLink?.getAttribute("aria-current")).toBe("page");
  });
});
