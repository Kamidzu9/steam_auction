"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuctionWheel, { AuctionWheelHandle } from "../../components/AuctionWheel";

type User = {
  id: string;
  steamId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type GameItem = {
  appid: number;
  name: string;
  playtime_forever?: number;
};

type Friend = {
  id: string;
  steamId: string;
  displayName?: string | null;
};

type SteamProfile = {
  steamid: string;
  personaname: string;
  avatarfull: string;
};

type Pool = {
  id: string;
  name: string;
};

const COMMON_TAG_OPTIONS = [
  "coop",
  "multiplayer",
  "single-player",
  "online co-op",
  "local co-op",
];

type ApiErrorResponse = { error?: string };

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Request failed";
}

async function safeFetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorResponse;
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Request failed";
    throw new Error(message);
  }
  return data as T & ApiErrorResponse;
}

type IconProps = { className?: string };

function IconLink({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M10 13a4 4 0 0 1 0-6l2-2a4 4 0 1 1 6 6l-1.5 1.5" />
      <path d="M14 11a4 4 0 0 1 0 6l-2 2a4 4 0 1 1-6-6L7.5 11" />
    </svg>
  );
}

function IconRefresh({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M20 6v6h-6" />
      <path d="M4 18a8 8 0 0 0 13.7-5.2" />
    </svg>
  );
}

function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="17" cy="9.5" r="2.6" />
      <path d="M3 19c0-3 2.6-5.4 5.8-5.4S14.6 16 14.6 19" />
      <path d="M14.4 19c0-2.3 1.9-4.1 4.2-4.1" />
    </svg>
  );
}

function IconIntersect({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </svg>
  );
}

function IconStack({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 8l8-4 8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  );
}

function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const loginFailed = searchParams?.get("login") === "failed";

  const [user, setUser] = useState<User | null>(null);
  const [myGames, setMyGames] = useState<GameItem[]>([]);
  const [friendGames, setFriendGames] = useState<GameItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [gameTagsMap, setGameTagsMap] = useState<Record<number, string[]>>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendSteamId, setFriendSteamId] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendFilter, setFriendFilter] = useState("");
  const [pool, setPool] = useState<Pool | null>(null);
  const [status, setStatus] = useState<string>("");
  const [pickMode, setPickMode] = useState<"pure" | "avoid">("pure");
  const [avoidCount, setAvoidCount] = useState(3);
  const [pickResult, setPickResult] = useState<string>("");
  const [pickPulse, setPickPulse] = useState(false);
  const [pickImage, setPickImage] = useState<string | null>(null);
  const [spinSeconds, setSpinSeconds] = useState<number>(4.2);
  const [error, setError] = useState<string>("");
  const [poolSeeded, setPoolSeeded] = useState(false);
  const autoSyncRef = useRef(false);
  const wheelRef = useRef<AuctionWheelHandle | null>(null);

  const isLoggedIn = Boolean(user?.steamId);

  const intersection = useMemo(() => {
    const myMap = new Map(myGames.map((g) => [g.appid, g]));
    return friendGames.filter((g) => myMap.has(g.appid));
  }, [myGames, friendGames]);

  const filteredIntersection = useMemo(() => {
    if (!selectedTags.length) return intersection;
    return intersection.filter((g) => {
      const tags = gameTagsMap[g.appid] ?? [];
      if (!tags || tags.length === 0) return false;
      return selectedTags.every((t) => tags.includes(t.toLowerCase()));
    });
  }, [intersection, selectedTags, gameTagsMap]);

  const previewGames = useMemo(
    () => filteredIntersection.slice(0, 12),
    [filteredIntersection]
  );

  const loadUser = useCallback(async () => {
    try {
      const data = await safeFetchJson<{ user: User | null }>("/api/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const data = await safeFetchJson<{ friends: Friend[] }>("/api/friends");
      setFriends(data.friends ?? []);
    } catch {
      setFriends([]);
    }
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setFriends([]);
    setMyGames([]);
    setFriendGames([]);
    setSelectedFriendIds([]);
    setPool(null);
    setPickResult("");
    setPickImage(null);
    setStatus("Ausgeloggt.");
    setError("");
    autoSyncRef.current = false;
  }

  async function deleteFriend(id: string) {
    if (!confirm("Delete this friend?")) return;
    try {
      await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // ignore
    }
    await loadFriends();
    setSelectedFriendIds((prev) => prev.filter((x) => x !== id));
  }

  const fetchMyGames = useCallback(async () => {
    if (!user?.steamId) return;
    setStatus("Lade deine Spiele...");
    setError("");
    try {
      const data = await safeFetchJson<{ games?: GameItem[]; error?: string }>(
        `/api/steam/owned-games?steamId=${user.steamId}`
      );
      if (data.error) {
        setError(data.error);
        setStatus("");
        return;
      }
      const games = data.games ?? [];
      if (games.length === 0) {
        setError("Keine Spiele erhalten. Pruefe deine Steam-Privatsphaere.");
      }
      setMyGames(games);
      setStatus("");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }, [user?.steamId]);

  const fetchFriendList = useCallback(async () => {
    if (!user?.steamId) return;
    setStatus("Lade Steam-Freunde...");
    setError("");
    try {
      const data = await safeFetchJson<{
        friends?: { steamid: string }[];
        profiles?: SteamProfile[];
        error?: string;
      }>(`/api/steam/friends?steamId=${user.steamId}`);
      if (data.error) {
        setError(data.error);
        setStatus("");
        return;
      }
      const profiles = data.profiles ?? [];
      if (profiles.length) {
        const payload = profiles.slice(0, 200).map((profile) => ({
          steamId: profile.steamid,
          displayName: profile.personaname,
        }));
        await safeFetchJson<{ ok: true; count: number }>("/api/friends/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friends: payload }),
        });
      }
      await loadFriends();
      setStatus(
        data.friends?.length
          ? "Freundesliste geladen und gespeichert."
          : "Keine oeffentliche Freundesliste gefunden."
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }, [loadFriends, user?.steamId]);

  async function addFriend() {
    if (!friendSteamId) {
      setError("Bitte eine SteamID eingeben.");
      return;
    }
    setStatus("Freund wird gespeichert...");
    setError("");
    try {
      await safeFetchJson<{ friend: Friend }>("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId: friendSteamId }),
      });
      setFriendSteamId("");
      await loadFriends();
      setStatus("");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }

  async function fetchSelectedFriendsGames() {
    if (!user?.steamId) {
      setError("Bitte zuerst mit Steam anmelden.");
      return;
    }
    if (selectedFriendIds.length === 0) {
      setError("Bitte waehle mindestens einen Freund.");
      return;
    }
    if (myGames.length === 0) {
      setError("Bitte lade zuerst deine Spiele.");
      return;
    }
    setStatus("Lade gemeinsame Spiele...");
    setError("");

    try {
      let sharedAppIds: Set<number> | null = null;
      const friendPlaytimeMap = new Map<number, number>();

      for (const friendId of selectedFriendIds) {
        const friend = friends.find((f) => f.id === friendId);
        if (!friend?.steamId) continue;
        let games: GameItem[] = [];
        try {
          const data = await safeFetchJson<{ games?: GameItem[]; error?: string }>(
            `/api/steam/owned-games?steamId=${friend.steamId}`
          );
          if (data.error) {
            setError(data.error);
            continue;
          }
          games = data.games ?? [];
        } catch (err) {
          setError(getErrorMessage(err));
          continue;
        }
        const appSet = new Set(games.map((g) => g.appid));
        for (const g of games) {
          const prev = friendPlaytimeMap.get(g.appid) ?? 0;
          friendPlaytimeMap.set(g.appid, prev + (g.playtime_forever ?? 0));
        }
        if (sharedAppIds === null) sharedAppIds = appSet;
        else {
          sharedAppIds = new Set(
            Array.from(sharedAppIds as Set<number>).filter((id) => appSet.has(id))
          );
        }
      }

      const mySet = new Set(myGames.map((g) => g.appid));
      const finalIds = sharedAppIds ? [...sharedAppIds].filter((id) => mySet.has(id)) : [];
      const finalGames = myGames.filter((g) => finalIds.includes(g.appid));
      setFriendGames(finalGames);
      void prefetchTagsForGames(finalGames);
      setStatus(finalGames.length ? "Gemeinsame Spiele geladen." : "Keine gemeinsamen Spiele gefunden.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function fetchGameTags(appid: number) {
    if (gameTagsMap[appid]) return gameTagsMap[appid];
    try {
      const data = await safeFetchJson<{
        categories?: string[];
        genres?: string[];
        error?: string;
      }>(`/api/steam/app-details?appId=${appid}`);
      if (data.error) return [];
      const tags: string[] = [];
      if (Array.isArray(data.categories)) tags.push(...data.categories.map((t) => t.toLowerCase()));
      if (Array.isArray(data.genres)) tags.push(...data.genres.map((t) => t.toLowerCase()));
      const dedup = Array.from(new Set(tags));
      setGameTagsMap((s) => ({ ...s, [appid]: dedup }));
      return dedup;
    } catch {
      return [];
    }
  }

  function prefetchTagsForGames(games: GameItem[]) {
    for (const g of games) {
      if (!gameTagsMap[g.appid]) void fetchGameTags(g.appid);
    }
  }

  async function createPool() {
    if (selectedFriendIds.length === 0) {
      setError("Bitte waehle einen Freund aus.");
      return;
    }
    setStatus("Pool wird erstellt...");
    setError("");
    setPoolSeeded(false);
    const firstFriend = selectedFriendIds[0];
    try {
      const data = await safeFetchJson<{ pool: Pool }>("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: firstFriend, name: "Auction Pool" }),
      });
      setPool(data.pool);
      if (intersection.length > 0) {
        await addIntersectionToPool(data.pool.id);
      } else {
        setStatus("Pool erstellt. Keine gemeinsamen Spiele vorhanden.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }

  async function addIntersectionToPool(poolIdOverride?: string) {
    const poolId = poolIdOverride ?? pool?.id;
    if (!poolId) {
      setError("Bitte zuerst einen Pool erstellen.");
      return;
    }
    if (intersection.length === 0) {
      setError("Keine gemeinsamen Spiele geladen.");
      return;
    }
    setStatus("Gemeinsame Spiele werden hinzugefuegt...");
    setError("");
    let skipped = 0;
    let failed = 0;
    const skippedNames: string[] = [];

    for (const game of intersection) {
      try {
        const res = await fetch(`/api/pools/${poolId}/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: game.appid,
            name: game.name,
            storeUrl: `https://store.steampowered.com/app/${game.appid}`,
            weight: 1,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { skipped?: boolean };
        if (!res.ok) {
          failed += 1;
          continue;
        }
        if (data?.skipped) {
          skipped++;
          skippedNames.push(game.name);
        }
      } catch {
        failed += 1;
      }
    }

    setPoolSeeded(true);
    if (failed > 0) {
      setError(`Fehler beim Hinzufuegen: ${failed} Spiele konnten nicht gespeichert werden.`);
    }
    setStatus(skipped ? `Pool aktualisiert. ${skipped} Titel uebersprungen.` : "Pool aktualisiert.");
    if (skippedNames.length > 0) {
      setError(`Uebersprungen: ${skippedNames.slice(0, 5).join(", ")}${
        skippedNames.length > 5 ? ` (+${skippedNames.length - 5} weitere)` : ""
      }`);
    }
  }

  async function pickGame() {
    if (!pool?.id) {
      setError("Bitte zuerst einen Pool erstellen.");
      return;
    }
    setStatus("Spiel wird ausgewaehlt...");
    setError("");
    try {
      const data = await safeFetchJson<{ pick?: { name: string; appId?: number }; error?: string }>(
        `/api/pools/${pool.id}/pick`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: pickMode, avoidCount }),
        }
      );
      if (data.error) {
        setError(data.error);
        setStatus("");
        return;
      }
      const pickedName = data.pick?.name;
      const pickedAppId = data.pick?.appId;
      if (pickedName) {
        setStatus("Wheel dreht...");
        if (pickedAppId && wheelRef.current) {
          try {
            const durationMs = Math.max(200, Math.round(spinSeconds * 1000));
            await wheelRef.current.spinTo(pickedAppId, durationMs);
          } catch {
            // ignore spin errors
          }
        }
        setPickResult(pickedName);
        const picked = intersection.find((g) => g.appid === pickedAppId);
        setPickImage(picked ? `https://cdn.akamai.steamstatic.com/steam/apps/${picked.appid}/header.jpg` : null);
        setPickPulse(true);
        setTimeout(() => setPickPulse(false), 1200);
      } else {
        setPickResult("Kein Pick verfuegbar.");
      }
      setStatus("");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadUser();
      void loadFriends();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadFriends, loadUser]);

  useEffect(() => {
    if (!user?.steamId || autoSyncRef.current) return;
    autoSyncRef.current = true;
    const t = window.setTimeout(() => {
      void fetchMyGames();
      void fetchFriendList();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchFriendList, fetchMyGames, user?.steamId]);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="surface rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? "Steam avatar"}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">
                Steam
              </div>
            )}
            <div>
              <h2 className="font-display text-lg text-white">Status & Login</h2>
              <p className="text-muted mt-1 text-sm">
                {isLoggedIn
                  ? `Eingeloggt als ${user?.displayName ?? user?.steamId}`
                  : "Nicht eingeloggt. Verbinde Steam, um Spiele zu laden."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isLoggedIn ? (
              <a
                id="btn-steam-login"
                className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
                href="/api/auth/steam"
              >
                <IconLink className="h-4 w-4" />
                Mit Steam verbinden
              </a>
            ) : (
              <>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                  Verbunden
                </span>
                <button
                  className="btn-animated rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:border-white/40"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {loginFailed ? (
          <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Steam Login fehlgeschlagen. Bitte pruefe deine Steam-Session oder die STEAM_REALM URL.
          </div>
        ) : null}

        {status ? <p className="mt-3 text-sm text-slate-200 animate-slide-up">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-200 animate-slide-up">{error}</p> : null}
        <div className="mt-4 grid gap-2 text-sm text-slate-400 md:grid-cols-3 animate-slide-up">
          <span>Meine Spiele: {myGames.length}</span>
          <span>Freund-Spiele: {friendGames.length}</span>
          <span>Gemeinsam: {intersection.length}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            id="btn-load-games"
            className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02] active:scale-95"
            onClick={fetchMyGames}
            disabled={!isLoggedIn}
          >
            <IconRefresh className="h-4 w-4" />
            Meine Spiele laden
          </button>
          <Link
            className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
            href="/pools"
          >
            <IconStack className="h-4 w-4" />
            Pools ansehen
          </Link>
        </div>
      </section>

      <section className="surface rounded-2xl p-6 card-animated animate-pop">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg text-white">Freunde</h2>
            <p className="text-muted mt-2 text-sm">
              Lade deine Steam-Freunde oder fuege eine SteamID manuell hinzu.
            </p>
          </div>
          <button
            id="btn-load-friends"
            className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
            onClick={fetchFriendList}
            disabled={!isLoggedIn}
          >
            <IconUsers className="h-4 w-4" />
            Steam-Freunde laden
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="w-60 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="Friend SteamID"
            value={friendSteamId}
            onChange={(event) => setFriendSteamId(event.target.value)}
          />
          <button
            className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
            onClick={addFriend}
            disabled={!isLoggedIn}
          >
            <IconPlus className="h-4 w-4" />
            Freund speichern
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <input
              placeholder="Freund suchen..."
              value={friendFilter}
              onChange={(e) => setFriendFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <div
              id="friends-list"
              className="mt-2 h-44 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2"
            >
              {friends.length === 0 ? (
                <div className="text-sm text-muted p-2">
                  Noch keine gespeicherten Freunde. Lade Steam-Freunde oder fuege eine ID hinzu.
                </div>
              ) : (
                friends
                  .filter((f) => {
                    if (!friendFilter) return true;
                    const needle = friendFilter.toLowerCase();
                    return (
                      (f.displayName ?? "").toLowerCase().includes(needle) ||
                      f.steamId.toLowerCase().includes(needle)
                    );
                  })
                  .map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                    >
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedFriendIds.includes(friend.id)}
                          onChange={() =>
                            setSelectedFriendIds((prev) =>
                              prev.includes(friend.id)
                                ? prev.filter((id) => id !== friend.id)
                                : [...prev, friend.id]
                            )
                          }
                          className="h-4 w-4"
                        />
                        <div className="text-sm text-slate-200">{friend.displayName ?? friend.steamId}</div>
                      </label>
                      <button
                        className="text-xs text-rose-300 hover:text-rose-200"
                        onClick={() => void deleteFriend(friend.id)}
                        aria-label="Delete friend"
                        title="Delete friend"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                className="btn-animated rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-white/40"
                onClick={() => setSelectedFriendIds(friends.map((f) => f.id))}
                disabled={friends.length === 0}
              >
                Alle waehlen
              </button>
              <button
                className="btn-animated rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-white/40"
                onClick={() => setSelectedFriendIds([])}
                disabled={selectedFriendIds.length === 0}
              >
                Auswahl loeschen
              </button>
            </div>
            <button
              id="btn-load-shared"
              className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
              onClick={() => void fetchSelectedFriendsGames()}
              disabled={selectedFriendIds.length === 0}
            >
              <IconIntersect className="h-4 w-4" />
              Gemeinsame Spiele laden
            </button>
            <p className="text-xs text-muted">
              Tipp: Waehle zuerst Freunde aus, um die Intersection zu berechnen.
            </p>
          </div>
        </div>
      </section>

      <section className="surface rounded-2xl p-6 card-animated animate-pop">
        <h2 className="font-display text-lg text-white">Gemeinsame Spiele</h2>
        <p className="text-muted mt-2 text-sm">Gefundene Intersection: {intersection.length}</p>
        <div className="mt-3">
          <label className="text-sm text-slate-300">Filter nach Tags:</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_TAG_OPTIONS.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(t)}
                  onChange={() =>
                    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                  className="h-4 w-4"
                />
                <span className="text-slate-200">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {previewGames.length > 0 ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {previewGames.map((game) => (
              <div
                key={game.appid}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200"
              >
                <span>{game.name}</span>
                <span className="text-xs text-slate-400">#{game.appid}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted mt-4 text-sm">
            Keine passenden Spiele gefunden. Pruefe deine Auswahl oder lade die Spiele neu.
          </p>
        )}
      </section>

      <section className="surface rounded-2xl p-6 card-animated animate-pop">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg text-white">Pool & Pick</h2>
            <p className="text-muted mt-2 text-sm">
              Erstelle einen Pool, speichere die gemeinsamen Spiele und lasse die Auktion entscheiden.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              id="btn-create-pool"
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
              onClick={createPool}
              disabled={selectedFriendIds.length === 0}
            >
              <IconStack className="h-4 w-4" />
              Pool erstellen
            </button>
            <button
              id="btn-add-shared"
              className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
              onClick={() => void addIntersectionToPool()}
              disabled={!pool?.id || intersection.length === 0}
            >
              <IconPlus className="h-4 w-4" />
              Spiele hinzufuegen
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Modus:</label>
            <select
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={pickMode}
              onChange={(e) => setPickMode(e.target.value as "pure" | "avoid")}
            >
              <option value="pure">Zufall (pure)</option>
              <option value="avoid">Avoid repeats</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Avoid:</label>
            <input
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
              type="number"
              min={1}
              value={avoidCount}
              onChange={(e) => setAvoidCount(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Spin (s):</label>
            <input
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
              type="number"
              step={0.1}
              min={0.5}
              value={spinSeconds}
              onChange={(e) => setSpinSeconds(Number(e.target.value))}
            />
          </div>
        </div>

        <div id="wheel" className="mt-6 flex items-center justify-center">
          <AuctionWheel
            ref={wheelRef}
            items={filteredIntersection.map((g) => ({ appid: g.appid, name: g.name }))}
            onCenterClick={() => void pickGame()}
          />
        </div>

        {pickResult ? (
          <div
            className={`mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 transition ${
              pickPulse ? "animate-reveal-pick animate-pulse-once" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {pickImage ? (
                <Image
                  src={pickImage}
                  alt={pickResult}
                  width={460}
                  height={215}
                  className="h-16 w-28 rounded-md object-cover shadow-md"
                  sizes="(max-width: 768px) 112px, 112px"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (!t.src.includes("header.jpg")) {
                      t.src = "https://cdn.akamai.steamstatic.com/steam/apps/0/header.jpg";
                    }
                  }}
                />
              ) : null}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Ergebnis</div>
                <div className="text-lg font-semibold">{pickResult}</div>
              </div>
            </div>
          </div>
        ) : null}

        {pool?.id ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>
              Pool ID: {pool.id} {poolSeeded ? "(seeded)" : ""}
            </span>
            <Link
              className="inline-flex items-center gap-1 text-amber-200 hover:text-amber-100"
              href={`/pools/${pool.id}`}
            >
              <IconArrowRight className="h-4 w-4" />
              Pool oeffnen
            </Link>
          </div>
        ) : null}
        <p className="text-muted mt-3 text-xs">
          Avoid schliesst die letzten Picks aus. Die Spin-Dauer steuert die Animation.
        </p>
      </section>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">So funktioniert&apos;s</h2>
        <ol className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <li>1. Steam verbinden und Spiele laden.</li>
          <li>2. Freunde waehlen und gemeinsame Spiele berechnen.</li>
          <li>3. Pool erstellen und Spiele hinzufuegen.</li>
          <li>4. Pick starten und gemeinsam loslegen.</li>
        </ol>
      </section>
    </div>
  );
}
