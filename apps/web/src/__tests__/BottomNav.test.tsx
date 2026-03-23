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

// Mock ApiProvider — control auth state per test
vi.mock("../lib/ApiProvider", () => ({
  useApi: vi.fn(),
}));

import BottomNav from "../components/BottomNav";
import { useApi } from "../lib/ApiProvider";
import { usePathname } from "next/navigation";

const mockUseApi = vi.mocked(useApi);
const mockUsePathname = vi.mocked(usePathname);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BottomNav", () => {
  it("renders nothing when accessToken is null (logged out)", () => {
    mockUseApi.mockReturnValue({ accessToken: null, isLoading: false } as ReturnType<typeof useApi>);
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing while auth is loading", () => {
    mockUseApi.mockReturnValue({ accessToken: null, isLoading: true } as ReturnType<typeof useApi>);
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the navigation when user is authenticated", () => {
    mockUseApi.mockReturnValue({ accessToken: "tok", isLoading: false } as ReturnType<typeof useApi>);
    render(<BottomNav />);
    expect(screen.getByRole("navigation", { name: /primary/i })).not.toBeNull();
  });

  it("renders all expected navigation links when authenticated", () => {
    mockUseApi.mockReturnValue({ accessToken: "tok", isLoading: false } as ReturnType<typeof useApi>);
    render(<BottomNav />);

    const expectedLabels = ["Home", "Dashboard", "Pools", "Library", "Friends", "Profile"];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).not.toBeNull();
    }
  });

  it("sets aria-current='page' on the active route link", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseApi.mockReturnValue({ accessToken: "tok", isLoading: false } as ReturnType<typeof useApi>);
    render(<BottomNav />);

    const activeLink = screen.getByText("Dashboard").closest("a");
    expect(activeLink?.getAttribute("aria-current")).toBe("page");
  });

  it("does not set aria-current on inactive links", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseApi.mockReturnValue({ accessToken: "tok", isLoading: false } as ReturnType<typeof useApi>);
    render(<BottomNav />);

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink?.getAttribute("aria-current")).toBeNull();
  });

  it("marks /pools/* as active when on a pool detail page", () => {
    mockUsePathname.mockReturnValue("/pools/abc-123");
    mockUseApi.mockReturnValue({ accessToken: "tok", isLoading: false } as ReturnType<typeof useApi>);
    render(<BottomNav />);

    const poolsLink = screen.getByText("Pools").closest("a");
    expect(poolsLink?.getAttribute("aria-current")).toBe("page");
  });
});
