import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// Mock ApiProvider before importing the component
const mockGetMe = vi.fn();
const mockClient = {
  steamLoginUrl: "https://steam.example.com/login",
  getMe: mockGetMe,
};

vi.mock("../lib/ApiProvider", () => ({
  useApi: vi.fn(() => ({
    client: mockClient,
    accessToken: null,
    isLoading: false,
  })),
}));

// Mock onboarding helpers
vi.mock("../lib/onboarding", () => ({
  completeOnboarding: vi.fn(),
}));

import Onboarding from "../components/Onboarding";
import { useApi } from "../lib/ApiProvider";

const mockUseApi = vi.mocked(useApi);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Onboarding", () => {
  it("renders the Welcome step by default", () => {
    render(<Onboarding />);
    expect(screen.getByText("Welcome to Steam Auction")).not.toBeNull();
    expect(screen.getByText("Get Started")).not.toBeNull();
  });

  it("advances to Connect Steam step when clicking Get Started", () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("Connect your Steam account")).not.toBeNull();
  });

  it("shows a steam login link on the Connect Steam step", () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByText("Get Started"));

    const link = screen.getByText("Connect with Steam").closest("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe(
      "https://steam.example.com/login",
    );
  });

  it("advances to Ready (skipped) step when clicking Skip for now", () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByText("Get Started"));
    fireEvent.click(screen.getByText("Skip for now"));

    expect(screen.getByText("You\u2019re good to go")).not.toBeNull();
    expect(screen.getByText("Explore the App")).not.toBeNull();
  });

  it("navigates back from Connect Steam to Welcome when clicking Back", () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("Connect your Steam account")).not.toBeNull();

    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Welcome to Steam Auction")).not.toBeNull();
  });

  it("shows connected state on Ready step when accessToken is present", () => {
    mockUseApi.mockReturnValue({
      client: mockClient as ReturnType<typeof useApi>["client"],
      accessToken: "tok_123",
      isLoading: false,
      setAccessToken: vi.fn(),
    });

    mockGetMe.mockResolvedValue({
      user: { displayName: "TestPlayer", avatarUrl: "https://img.example.com/avatar.jpg" },
    });

    render(<Onboarding />);

    // Step 0 → step 1, but with accessToken the effect auto-advances to step 2
    fireEvent.click(screen.getByText("Get Started"));

    expect(screen.getByText("You\u2019re all set!")).not.toBeNull();
    expect(screen.getByText("Go to Dashboard")).not.toBeNull();
  });
});
