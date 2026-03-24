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

type WheelItem = { appid: number; name: string };
type SpinState = "idle" | "preparing" | "spinning" | "result";

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

function IconUser({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="7.5" r="3.4" />
      <path d="M4.5 19c1.8-3.3 5-5 7.5-5s5.7 1.7 7.5 5" />
    </svg>
  );
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const loginFailed = searchParams?.get("login") === "failed";

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
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
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeWheelItem, setActiveWheelItem] = useState<WheelItem | null>(null);
  const [recentAvoidAppIds, setRecentAvoidAppIds] = useState<number[]>([]);
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
      return selectedTags.some((t) => tags.includes(t.toLowerCase()));
    });
  }, [intersection, selectedTags, gameTagsMap]);

  const wheelItems = useMemo(() => {
    if (pickMode !== "avoid" || avoidCount <= 0 || recentAvoidAppIds.length === 0) {
      return filteredIntersection;
    }
    const blocked = new Set(recentAvoidAppIds);
    return filteredIntersection.filter((game) => !blocked.has(game.appid));
  }, [avoidCount, filteredIntersection, pickMode, recentAvoidAppIds]);

  const previewGames = useMemo(() => wheelItems.slice(0, 12), [wheelItems]);
  const spinningItem = activeWheelItem ?? wheelItems[0] ?? null;
  const canUseSteam = authReady && isLoggedIn;
  const hasFriendSelection = selectedFriendIds.length > 0;
  const hasMyGames = myGames.length > 0;
  const hasWheelItems = wheelItems.length > 0;
  const canLoadShared = canUseSteam && hasFriendSelection && hasMyGames;
  const canCreatePool = canUseSteam && hasFriendSelection;
  const canAddToPool = canUseSteam && Boolean(pool?.id) && filteredIntersection.length > 0;
  const hasPoolOrFriend = Boolean(pool?.id) || hasFriendSelection;
  const isSpinBusy = spinState === "preparing" || spinState === "spinning";
  const canPick = canUseSteam && hasWheelItems && hasPoolOrFriend && !isSpinBusy;
  const pickDisabledReason = isSpinBusy
    ? spinState === "preparing"
      ? "Spin wird vorbereitet..."
      : "Wheel dreht..."
    : !authReady
      ? "Session wird geladen..."
      : !isLoggedIn
        ? "Bitte erst mit Steam verbinden."
        : !hasWheelItems
          ? "Keine passenden Spiele im Wheel."
          : !hasPoolOrFriend
            ? "Bitte zuerst einen Freund waehlen."
            : undefined;

  const loadUser = useCallback(async () => {
    try {
      const data = await safeFetchJson<{ user: User | null }>("/api/me", { cache: "no-store" });
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setAuthReady(true);
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

  const refreshRecentAvoid = useCallback(async () => {
    if (pickMode !== "avoid" || avoidCount <= 0 || !pool?.id) {
      setRecentAvoidAppIds([]);
      return;
    }
    try {
      const data = await safeFetchJson<{ appIds?: number[] }>(
        `/api/pools/${pool.id}/recent-picks?limit=${avoidCount}`
      );
      const appIds = Array.isArray(data.appIds)
        ? data.appIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : [];
      setRecentAvoidAppIds(appIds);
    } catch {
      setRecentAvoidAppIds([]);
    }
  }, [avoidCount, pickMode, pool?.id]);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
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
    } finally {
      setIsLoggingOut(false);
    }
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

  function toggleTagPreset(nextTags: string[]) {
    setSelectedTags((prev) => {
      const prevKey = prev.join("|");
      const nextKey = nextTags.join("|");
      return prevKey === nextKey ? [] : nextTags;
    });
  }

  async function addFriend() {
    const trimmed = friendSteamId.trim();
    if (!trimmed) {
      setError("Bitte eine SteamID eingeben.");
      return;
    }
    setStatus("Freund wird gespeichert...");
    setError("");
    try {
      await safeFetchJson<{ friend: Friend }>("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId: trimmed }),
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

  async function createPool(options?: { seedPool?: boolean }) {
    if (selectedFriendIds.length === 0) {
      setError("Bitte waehle einen Freund aus.");
      return;
    }
    setStatus("Pool wird erstellt...");
    setError("");
    setPoolSeeded(false);
    const firstFriend = selectedFriendIds[0];
    const shouldSeed = options?.seedPool ?? true;
    try {
      const data = await safeFetchJson<{ pool: Pool }>("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: firstFriend, name: "Auction Pool" }),
      });
      setPool(data.pool);
      if (shouldSeed && filteredIntersection.length > 0) {
        await addIntersectionToPool(data.pool.id);
      } else if (shouldSeed) {
        setStatus("Pool erstellt. Keine gemeinsamen Spiele vorhanden.");
      } else {
        setStatus("Pool erstellt.");
      }
      return data.pool;
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
      return null;
    }
  }

  async function addIntersectionToPool(poolIdOverride?: string) {
    const poolId = poolIdOverride ?? pool?.id;
    if (!poolId) {
      setError("Bitte zuerst einen Pool erstellen.");
      return;
    }
    if (filteredIntersection.length === 0) {
      setError("Keine passenden Spiele geladen.");
      return;
    }
    setStatus("Gemeinsame Spiele werden hinzugefuegt...");
    setError("");
    let skipped = 0;
    let failed = 0;
    const skippedNames: string[] = [];

    for (const game of filteredIntersection) {
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
    if (isSpinBusy) return;
    if (wheelItems.length === 0) {
      setError("Keine passenden Spiele im Wheel.");
      return;
    }
    setSpinState("preparing");
    setStatus("Bereite Spin vor...");
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 450));
    let poolId = pool?.id;
    let shouldSeed = false;
    if (!poolId) {
      if (selectedFriendIds.length === 0) {
        setError("Bitte zuerst einen Freund waehlen.");
        setSpinState("idle");
        return;
      }
      setStatus("Pool wird erstellt...");
      const created = await createPool({ seedPool: false });
      poolId = created?.id;
      if (!poolId) {
        setError("Pool konnte nicht erstellt werden.");
        setSpinState("idle");
        return;
      }
      shouldSeed = true;
    }
    if ((shouldSeed || !poolSeeded) && filteredIntersection.length > 0) {
      setStatus("Pool wird befuellt...");
      await addIntersectionToPool(poolId);
    }
    setPickResult("");
    setPickImage(null);
    setSpinState("spinning");
    setStatus("Spiel wird ausgewaehlt...");
    try {
      const data = await safeFetchJson<{ pick?: { name: string; appId?: number }; error?: string }>(
        `/api/pools/${poolId}/pick`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: pickMode,
            avoidCount,
            appIds: wheelItems.map((g) => g.appid),
          }),
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
        const picked = wheelItems.find((g) => g.appid === pickedAppId);
        setPickImage(picked ? `https://cdn.akamai.steamstatic.com/steam/apps/${picked.appid}/header.jpg` : null);
        setPickPulse(true);
        setTimeout(() => setPickPulse(false), 1200);
        setSpinState("result");
      } else {
        setPickResult("Kein Pick verfuegbar.");
        setSpinState("idle");
      }
      setStatus("");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
      setSpinState("idle");
    } finally {
      void refreshRecentAvoid();
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

  useEffect(() => {
    if (!pool?.id) return;
    setPoolSeeded(false);
  }, [selectedFriendIds, intersection.length]);

  useEffect(() => {
    void refreshRecentAvoid();
  }, [refreshRecentAvoid]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="surface rounded-2xl p-6 animate-pulse">
          <div className="h-5 w-40 bg-white/10 rounded mb-3" />
          <div className="h-4 w-full bg-white/10 rounded mb-2" />
          <div className="h-4 w-2/3 bg-white/10 rounded mb-5" />
          <div className="h-10 w-44 bg-white/10 rounded-full" />
        </div>
      </div>
    );
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="space-y-4 animate-fade-in">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Willkommen</h1>
          <p className="text-muted mt-2 text-sm">
            Verbinde dein Steam-Konto, um deine Spiele zu laden und mit Freunden zu vergleichen.
          </p>
          {loginFailed && (
            <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              Steam Login fehlgeschlagen. Bitte pruefe deine Steam-Session.
            </div>
          )}
          <div className="mt-6">
            <a
              id="btn-steam-login"
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
              href="/api/auth/steam"
            >
              <IconLink className="h-4 w-4" />
              Mit Steam verbinden
            </a>
          </div>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-base text-white">So funktioniert&apos;s</h2>
          <ol className="mt-4 space-y-3">
            {[
              "Steam verbinden und Spielebibliothek laden.",
              "Freund auswaehlen und gemeinsame Spiele berechnen.",
              "Pool erstellen und per Auktion ein Spiel ausloesen.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-200">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  // ── Logged in ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* User header */}
      <section className="surface rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? "Steam avatar"}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">
                <IconUser className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{user?.displayName ?? user?.steamId}</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-200">
                Steam verbunden
              </span>
            </div>
          </div>
          <button
            className="btn-animated rounded-full border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:border-white/40 hover:text-white disabled:opacity-60"
            onClick={logout}
            disabled={isLoggingOut}
          >
            Logout
          </button>
        </div>
        {loginFailed && (
          <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Steam Login fehlgeschlagen. Bitte pruefe deine Steam-Session.
          </div>
        )}
        {status && <p className="mt-3 text-sm text-slate-200 animate-slide-up">{status}</p>}
        {error && <p className="mt-3 text-sm text-rose-200 animate-slide-up">{error}</p>}
      </section>

      {/* Step 1 – Load your games */}
      <section className="surface rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${hasMyGames ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                {hasMyGames ? "✓" : "1"}
              </span>
              <h2 className="font-display text-base text-white">Deine Spielebibliothek</h2>
            </div>
            {hasMyGames ? (
              <p className="mt-1 text-sm text-muted pl-8">{myGames.length} Spiele geladen</p>
            ) : (
              <p className="mt-1 text-sm text-muted pl-8">
                Lade deine Steam-Bibliothek, um gemeinsame Spiele zu finden.
              </p>
            )}
          </div>
          <button
            id="btn-load-games"
            className="btn-animated flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={fetchMyGames}
            disabled={!canUseSteam}
          >
            <IconRefresh className="h-4 w-4" />
            {hasMyGames ? "Aktualisieren" : "Laden"}
          </button>
        </div>
      </section>

      {/* Step 2 – Select friends */}
      {hasMyGames && (
        <section className="surface rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${hasFriendSelection ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                {hasFriendSelection ? "✓" : "2"}
              </span>
              <h2 className="font-display text-base text-white">Freund auswaehlen</h2>
            </div>
            <button
              id="btn-load-friends"
              className="btn-animated flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white hover:border-white/40 disabled:opacity-60"
              onClick={fetchFriendList}
              disabled={!canUseSteam}
            >
              <IconUsers className="h-4 w-4" />
              Steam-Freunde laden
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-muted">
              Noch keine Freunde gespeichert. Lade deine Steam-Freundesliste oder fuege eine SteamID manuell hinzu.
            </div>
          ) : (
            <div className="mt-4">
              <input
                placeholder="Freund suchen..."
                value={friendFilter}
                onChange={(e) => setFriendFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <div
                id="friends-list"
                className="mt-2 max-h-52 overflow-auto rounded-lg border border-white/10 bg-black/20 p-2"
              >
                {friends
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
                      className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
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
                        <span className="truncate text-sm text-slate-200">
                          {friend.displayName ?? friend.steamId}
                        </span>
                      </label>
                      <button
                        className="flex-shrink-0 text-xs text-rose-400/70 hover:text-rose-300"
                        onClick={() => void deleteFriend(friend.id)}
                        aria-label="Delete friend"
                        title="Delete friend"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <button
                  className="text-slate-400 hover:text-white disabled:opacity-40"
                  onClick={() => setSelectedFriendIds(friends.map((f) => f.id))}
                  disabled={friends.length === 0}
                >
                  Alle waehlen
                </button>
                <span className="text-slate-600">·</span>
                <button
                  className="text-slate-400 hover:text-white disabled:opacity-40"
                  onClick={() => setSelectedFriendIds([])}
                  disabled={selectedFriendIds.length === 0}
                >
                  Auswahl loeschen
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-white/10 pt-4 flex flex-wrap items-center gap-3">
            <input
              className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="SteamID manuell hinzufuegen"
              value={friendSteamId}
              onChange={(event) => setFriendSteamId(event.target.value)}
            />
            <button
              className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40 disabled:opacity-60"
              onClick={addFriend}
              disabled={!canUseSteam || friendSteamId.trim().length === 0}
            >
              <IconPlus className="h-4 w-4" />
              Hinzufuegen
            </button>
          </div>
        </section>
      )}

      {/* Step 3 – Load shared games */}
      {hasFriendSelection && (
        <section className="surface rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${intersection.length > 0 ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                {intersection.length > 0 ? "✓" : "3"}
              </span>
              <h2 className="font-display text-base text-white">Gemeinsame Spiele</h2>
            </div>
            <button
              id="btn-load-shared"
              className="btn-animated flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02] disabled:opacity-60"
              onClick={() => void fetchSelectedFriendsGames()}
              disabled={!canLoadShared}
            >
              <IconIntersect className="h-4 w-4" />
              {intersection.length > 0 ? "Neu laden" : "Berechnen"}
            </button>
          </div>

          {intersection.length > 0 ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={`btn-animated rounded-full px-3 py-1 text-sm transition ${
                    selectedTags.join("|") === ["coop", "online co-op", "local co-op"].join("|")
                      ? "border border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                      : "border border-white/20 text-slate-300 hover:border-white/40"
                  }`}
                  onClick={() => toggleTagPreset(["coop", "online co-op", "local co-op"])}
                  type="button"
                >
                  Co-op ({filteredIntersection.length > 0 && selectedTags.length > 0 ? filteredIntersection.length : "alle"})
                </button>
                <button
                  className={`btn-animated rounded-full px-3 py-1 text-sm transition ${
                    selectedTags.join("|") === ["multiplayer"].join("|")
                      ? "border border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                      : "border border-white/20 text-slate-300 hover:border-white/40"
                  }`}
                  onClick={() => toggleTagPreset(["multiplayer"])}
                  type="button"
                >
                  Multiplayer
                </button>
                {selectedTags.length > 0 && (
                  <button
                    className="text-xs text-slate-400 hover:text-white"
                    onClick={() => setSelectedTags([])}
                    type="button"
                  >
                    Filter loeschen
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">
                {filteredIntersection.length} von {intersection.length} gemeinsamen Spielen
              </p>
              <div className="mt-3 grid gap-1.5 md:grid-cols-2">
                {previewGames.map((game) => (
                  <div
                    key={game.appid}
                    className="flex min-w-0 items-center rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-200"
                  >
                    <span className="min-w-0 flex-1 truncate">{game.name}</span>
                  </div>
                ))}
                {filteredIntersection.length > 12 && (
                  <p className="col-span-full text-xs text-slate-500 px-1">+{filteredIntersection.length - 12} weitere Spiele</p>
                )}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted pl-8">
              Lade gemeinsame Spiele, um einen Pool zu erstellen.
            </p>
          )}
        </section>
      )}

      {/* Step 4 – Pool & Pick */}
      {hasFriendSelection && intersection.length > 0 && (
        <section className="surface rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-semibold text-amber-200">
                4
              </span>
              <h2 className="font-display text-base text-white">Spiel ausloesen</h2>
            </div>
            {pool?.id ? (
              <Link
                className="btn-animated flex-shrink-0 inline-flex items-center gap-1 text-xs text-amber-200 hover:text-amber-100"
                href={`/pools/${pool.id}`}
              >
                <IconArrowRight className="h-3.5 w-3.5" />
                Pool oeffnen
              </Link>
            ) : (
              <button
                id="btn-create-pool"
                className="btn-animated flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white hover:border-white/40 disabled:opacity-60"
                onClick={() => void createPool()}
                disabled={!canCreatePool}
              >
                <IconStack className="h-4 w-4" />
                Pool erstellen
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Modus</label>
              <select
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white disabled:opacity-60"
                value={pickMode}
                onChange={(e) => setPickMode(e.target.value as "pure" | "avoid")}
                disabled={isSpinBusy}
              >
                <option value="pure">Zufall</option>
                <option value="avoid">Wiederholungen vermeiden</option>
              </select>
            </div>

            {pickMode === "avoid" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Letzte</label>
                <input
                  className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white disabled:opacity-60"
                  type="number"
                  min={1}
                  step={1}
                  value={avoidCount}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setAvoidCount((prev) =>
                      Number.isFinite(next) ? Math.max(1, Math.round(next)) : prev
                    );
                  }}
                  disabled={isSpinBusy}
                />
              </div>
            )}
          </div>

          <div
            id="wheel"
            className={`mt-5 flex items-center justify-center ${spinState === "preparing" ? "animate-pulse" : ""}`}
          >
            <AuctionWheel
              ref={wheelRef}
              items={wheelItems.map((g) => ({ appid: g.appid, name: g.name }))}
              onCenterClick={() => void pickGame()}
              disabled={!canPick}
              disabledReason={pickDisabledReason}
              allowDrag={false}
              onActiveItemChange={(item) =>
                setActiveWheelItem(item ? { appid: item.appid, name: item.name } : null)
              }
            />
          </div>

          {(isSpinBusy || pickResult) && (
            <div
              className={`mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition ${
                pickPulse ? "animate-reveal-pick animate-pulse-once" : ""
              }`}
            >
              {isSpinBusy ? (
                spinningItem ? (
                  <div className="flex items-center gap-3">
                    <Image
                      src={`https://cdn.akamai.steamstatic.com/steam/apps/${spinningItem.appid}/header.jpg`}
                      alt={spinningItem.name}
                      width={460}
                      height={215}
                      unoptimized
                      className="h-16 w-28 rounded-md object-cover shadow-md"
                      sizes="(max-width: 768px) 112px, 112px"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (!t.src.includes("/icons/icon-192.svg")) {
                          t.src = "/icons/icon-192.svg";
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Spinning…</div>
                      <div className="text-lg font-semibold leading-tight break-words text-white">
                        {spinningItem.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">Wheel dreht…</p>
                )
              ) : (
                <div className="flex items-center gap-3">
                  {pickImage && (
                    <Image
                      src={pickImage}
                      alt={pickResult}
                      width={460}
                      height={215}
                      unoptimized
                      className="h-16 w-28 rounded-md object-cover shadow-md"
                      sizes="(max-width: 768px) 112px, 112px"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (!t.src.includes("/icons/icon-192.svg")) {
                          t.src = "/icons/icon-192.svg";
                        }
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Heutiges Spiel</div>
                    <div className="text-lg font-semibold leading-tight break-words text-white">{pickResult}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
