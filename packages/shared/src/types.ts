// Shared domain types used across backend, frontend, and future mobile clients.
// No browser-only or Node-only imports allowed here.

export interface UserPublic {
  id: string;
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Game {
  id: string;
  appId: number;
  name: string;
  storeUrl: string;
  tags: string | null;
}

export interface PoolGame {
  id: string;
  poolId: string;
  gameId: string;
  weight: number;
  tags: string | null;
  game?: Game;
}

export interface AuctionPool {
  id: string;
  ownerId: string;
  friendId: string;
  name: string;
  createdAt: string;
  friend?: Friend;
  games?: PoolGame[];
}

export interface PickHistoryEntry {
  id: string;
  userId: string;
  poolId: string;
  gameId: string;
  pickedAt: string;
  mode: string;
  game?: Game;
}

export interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull: string;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  steamId: string;
  iat: number;
  exp: number;
}
