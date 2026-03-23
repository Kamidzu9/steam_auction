import type {
  UserPublic,
  Friend,
  AuctionPool,
  SteamGame,
  SteamPlayer,
  AuthTokens,
} from "@steam-auction/shared";
import type {
  CreatePoolInput,
  AddGameInput,
  PickGameInput,
  AddFriendInput,
  BulkAddFriendsInput,
} from "@steam-auction/shared";

export interface ApiClientOptions {
  baseUrl: string;
  /**
   * Called when the client needs a fresh access token.
   * Returns the token string, or null if the user is not authenticated.
   */
  getAccessToken?: () => string | null | Promise<string | null>;
  /**
   * Called when a 401 is received and a refresh attempt should be made.
   * Should attempt to refresh the token and return the new access token, or
   * null if refresh is not possible.
   */
  onRefresh?: () => Promise<string | null>;
  /**
   * Called when all auth attempts fail (user must log in again).
   */
  onAuthFailure?: () => void;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken?: () => string | null | Promise<string | null>;
  private onRefresh?: () => Promise<string | null>;
  private onAuthFailure?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getAccessToken = options.getAccessToken;
    this.onRefresh = options.onRefresh;
    this.onAuthFailure = options.onAuthFailure;
  }

  private async fetch<T>(
    path: string,
    init: RequestInit = {},
    retry = true
  ): Promise<T> {
    const token = this.getAccessToken ? await this.getAccessToken() : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });

    if (res.status === 401 && retry && this.onRefresh) {
      const newToken = await this.onRefresh();
      if (newToken) {
        return this.fetch<T>(path, init, false);
      }
      this.onAuthFailure?.();
      throw new ApiError("Unauthorized", 401);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new ApiError(body.error ?? `Request failed with status ${res.status}`, res.status);
    }

    return res.json() as Promise<T>;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────

  get steamLoginUrl(): string {
    return `${this.baseUrl}/auth/steam`;
  }

  async refresh(): Promise<AuthTokens & { user: UserPublic }> {
    return this.fetch<AuthTokens & { user: UserPublic }>("/auth/refresh", {
      method: "POST",
    });
  }

  async logout(): Promise<void> {
    await this.fetch("/auth/logout", { method: "POST" });
  }

  // ── Me ───────────────────────────────────────────────────────────────────

  async getMe(): Promise<{ user: UserPublic }> {
    return this.fetch<{ user: UserPublic }>("/me");
  }

  // ── Friends ──────────────────────────────────────────────────────────────

  async getFriends(): Promise<{ friends: Friend[] }> {
    return this.fetch<{ friends: Friend[] }>("/friends");
  }

  async addFriend(input: AddFriendInput): Promise<{ friend: Friend }> {
    return this.fetch<{ friend: Friend }>("/friends", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async addFriendsBulk(input: BulkAddFriendsInput): Promise<{ ok: boolean; count: number }> {
    return this.fetch<{ ok: boolean; count: number }>("/friends/bulk", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async deleteFriend(params: { id?: string; steamId?: string }): Promise<{ ok: boolean }> {
    return this.fetch<{ ok: boolean }>("/friends", {
      method: "DELETE",
      body: JSON.stringify(params),
    });
  }

  // ── Pools ────────────────────────────────────────────────────────────────

  async getPools(): Promise<{ pools: AuctionPool[] }> {
    return this.fetch<{ pools: AuctionPool[] }>("/pools");
  }

  async createPool(input: CreatePoolInput): Promise<{ pool: AuctionPool }> {
    return this.fetch<{ pool: AuctionPool }>("/pools", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async addGameToPool(
    poolId: string,
    input: AddGameInput
  ): Promise<{ poolGame?: unknown; skipped?: boolean; reason?: string }> {
    return this.fetch(`/pools/${poolId}/games`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async pickFromPool(
    poolId: string,
    input: PickGameInput = {}
  ): Promise<{ pick: { id: string; name: string; appId: number; storeUrl: string } }> {
    return this.fetch(`/pools/${poolId}/pick`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getRecentPicks(poolId: string, limit: number): Promise<{ appIds: number[] }> {
    return this.fetch(`/pools/${poolId}/recent-picks?limit=${limit}`);
  }

  // ── Steam ────────────────────────────────────────────────────────────────

  async getOwnedGames(steamId: string): Promise<{ games: SteamGame[] }> {
    return this.fetch<{ games: SteamGame[] }>(`/steam/owned-games?steamId=${encodeURIComponent(steamId)}`);
  }

  async getSteamFriends(
    steamId: string
  ): Promise<{ friends: { steamid: string }[]; profiles?: SteamPlayer[] }> {
    return this.fetch(`/steam/friends?steamId=${encodeURIComponent(steamId)}`);
  }

  async getAppDetails(
    appId: number
  ): Promise<{ categories: string[]; genres: string[]; data: unknown }> {
    return this.fetch(`/steam/app-details?appId=${appId}`);
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────

  async getLeaderboard(): Promise<{
    pickers: Array<{ userId: string; name: string; picks: number }>;
    games: Array<{ appId: number; name: string; picks: number }>;
  }> {
    return this.fetch("/leaderboard");
  }

  // ── Recommendations ──────────────────────────────────────────────────────

  async getRecommendations(): Promise<{
    topGames: Array<{ appId: number; name: string; picks: number }> | null[];
    recent: Array<{ appId: number; name: string }>;
  }> {
    return this.fetch("/recommendations");
  }
}
