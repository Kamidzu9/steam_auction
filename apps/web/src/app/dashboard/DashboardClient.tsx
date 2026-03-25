"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuctionWheelHandle } from "../../components/AuctionWheel";
import { useApi } from "../../lib/ApiProvider";
import { ApiError } from "@steam-auction/api-client";
import StatusSection from "./StatusSection";
import FriendsSection from "./FriendsSection";
import SharedGamesSection from "./SharedGamesSection";
import PickerSection from "./PickerSection";

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

type Pool = {
  id: string;
  name: string;
};

type WheelItem = { appid: number; name: string };
type SpinState = "idle" | "preparing" | "spinning" | "result";

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const loginFailed = searchParams?.get("login") === "failed";
  const { client, setAccessToken } = useApi();

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
  const [activeWheelItem, setActiveWheelItem] = useState<WheelItem | null>(
    null,
  );
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
    if (
      pickMode !== "avoid" ||
      avoidCount <= 0 ||
      recentAvoidAppIds.length === 0
    ) {
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
  const canAddToPool =
    canUseSteam && Boolean(pool?.id) && filteredIntersection.length > 0;
  const hasPoolOrFriend = Boolean(pool?.id) || hasFriendSelection;
  const isSpinBusy = spinState === "preparing" || spinState === "spinning";
  const canPick =
    canUseSteam && hasWheelItems && hasPoolOrFriend && !isSpinBusy;
  const pickDisabledReason = isSpinBusy
    ? spinState === "preparing"
      ? "Preparing spin..."
      : "Wheel spinning..."
    : !authReady
      ? "Loading session..."
      : !isLoggedIn
        ? "Please connect Steam first."
        : !hasWheelItems
          ? "No matching games in the wheel."
          : !hasPoolOrFriend
            ? "Please select a friend first."
            : undefined;

  const loadUser = useCallback(async () => {
    try {
      const data = await client.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }, [client]);

  const loadFriends = useCallback(async () => {
    try {
      const data = await client.getFriends();
      setFriends(data.friends ?? []);
    } catch {
      setFriends([]);
    }
  }, [client]);

  const refreshRecentAvoid = useCallback(async () => {
    if (pickMode !== "avoid" || avoidCount <= 0 || !pool?.id) {
      setRecentAvoidAppIds([]);
      return;
    }
    try {
      const data = await client.getRecentPicks(pool.id, avoidCount);
      const appIds = Array.isArray(data.appIds)
        ? data.appIds
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id))
        : [];
      setRecentAvoidAppIds(appIds);
    } catch {
      setRecentAvoidAppIds([]);
    }
  }, [avoidCount, client, pickMode, pool?.id]);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await client.logout();
      setAccessToken(null);
      setUser(null);
      setFriends([]);
      setMyGames([]);
      setFriendGames([]);
      setSelectedFriendIds([]);
      setPool(null);
      setPickResult("");
      setPickImage(null);
      setStatus("Logged out.");
      setError("");
      autoSyncRef.current = false;
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function deleteFriend(id: string) {
    if (!confirm("Delete this friend?")) return;
    try {
      await client.deleteFriend({ id });
    } catch {
      // ignore
    }
    await loadFriends();
    setSelectedFriendIds((prev) => prev.filter((x) => x !== id));
  }

  const fetchMyGames = useCallback(async () => {
    if (!user?.steamId) return;
    setStatus("Loading your games...");
    setError("");
    try {
      const data = await client.getOwnedGames(user.steamId);
      const games = data.games ?? [];
      if (games.length === 0) {
        setError("No games found. Check your Steam privacy settings.");
      }
      setMyGames(
        games.map((g) => ({
          appid: g.appid,
          name: g.name,
          playtime_forever: g.playtime_forever,
        })),
      );
      setStatus("");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }, [client, user?.steamId]);

  const fetchFriendList = useCallback(async () => {
    if (!user?.steamId) return;
    setStatus("Loading Steam friends...");
    setError("");
    try {
      const data = await client.getSteamFriends(user.steamId);
      const profiles = data.profiles ?? [];
      if (profiles.length) {
        const payload = profiles.slice(0, 200).map((profile) => ({
          steamId: profile.steamid,
          displayName: profile.personaname,
        }));
        await client.addFriendsBulk({ friends: payload });
      }
      await loadFriends();
      setStatus(
        data.friends?.length
          ? "Friends list loaded and saved."
          : "No public friends list found.",
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }, [client, loadFriends, user?.steamId]);

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
      setError("Please enter a Steam ID.");
      return;
    }
    setStatus("Saving friend...");
    setError("");
    try {
      await client.addFriend({ steamId: trimmed });
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
      setError("Please connect Steam first.");
      return;
    }
    if (selectedFriendIds.length === 0) {
      setError("Please select at least one friend.");
      return;
    }
    if (myGames.length === 0) {
      setError("Please load your games first.");
      return;
    }
    setStatus("Loading shared games...");
    setError("");

    try {
      let sharedAppIds: Set<number> | null = null;
      const friendPlaytimeMap = new Map<number, number>();

      for (const friendId of selectedFriendIds) {
        const friend = friends.find((f) => f.id === friendId);
        if (!friend?.steamId) continue;
        let games: GameItem[] = [];
        try {
          const data = await client.getOwnedGames(friend.steamId);
          games = (data.games ?? []).map((g) => ({
            appid: g.appid,
            name: g.name,
            playtime_forever: g.playtime_forever,
          }));
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
            Array.from(sharedAppIds as Set<number>).filter((id) =>
              appSet.has(id),
            ),
          );
        }
      }

      const mySet = new Set(myGames.map((g) => g.appid));
      const finalIds = sharedAppIds
        ? [...sharedAppIds].filter((id) => mySet.has(id))
        : [];
      const finalGames = myGames.filter((g) => finalIds.includes(g.appid));
      setFriendGames(finalGames);
      void prefetchTagsForGames(finalGames);
      setStatus(
        finalGames.length
          ? "Shared games loaded."
          : "No shared games found.",
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function fetchGameTags(appid: number) {
    if (gameTagsMap[appid]) return gameTagsMap[appid];
    try {
      const data = await client.getAppDetails(appid);
      const tags: string[] = [];
      if (Array.isArray(data.categories))
        tags.push(...data.categories.map((t) => t.toLowerCase()));
      if (Array.isArray(data.genres))
        tags.push(...data.genres.map((t) => t.toLowerCase()));
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
      setError("Please select a friend.");
      return;
    }
    setStatus("Creating pool...");
    setError("");
    setPoolSeeded(false);
    const firstFriend = selectedFriendIds[0];
    const shouldSeed = options?.seedPool ?? true;
    try {
      const data = await client.createPool({
        friendId: firstFriend!,
        name: "Auction Pool",
      });
      setPool(data.pool);
      if (shouldSeed && filteredIntersection.length > 0) {
        await addIntersectionToPool(data.pool.id);
      } else if (shouldSeed) {
        setStatus("Pool created. No shared games available.");
      } else {
        setStatus("Pool created.");
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
      setError("Please create a pool first.");
      return;
    }
    if (filteredIntersection.length === 0) {
      setError("No matching games loaded.");
      return;
    }
    setStatus("Adding shared games...");
    setError("");
    let skipped = 0;
    let failed = 0;
    const skippedNames: string[] = [];

    for (const game of filteredIntersection) {
      try {
        const res = await client.addGameToPool(poolId, {
          appId: game.appid,
          name: game.name,
          storeUrl: `https://store.steampowered.com/app/${game.appid}`,
          weight: 1,
        });
        if (res?.skipped) {
          skipped++;
          skippedNames.push(game.name);
        }
      } catch {
        failed += 1;
      }
    }

    setPoolSeeded(true);
    if (failed > 0) {
      setError(
        `Error: ${failed} games could not be saved.`,
      );
    }
    setStatus(
      skipped
        ? `Pool updated. ${skipped} titles skipped.`
        : "Pool updated.",
    );
    if (skippedNames.length > 0) {
      setError(
        `Skipped: ${skippedNames.slice(0, 5).join(", ")}${
          skippedNames.length > 5
            ? ` (+${skippedNames.length - 5} more)`
            : ""
        }`,
      );
    }
  }

  async function pickGame() {
    if (isSpinBusy) return;
    if (wheelItems.length === 0) {
      setError("No matching games in the wheel.");
      return;
    }
    setSpinState("preparing");
    setStatus("Preparing spin...");
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 450));
    let poolId = pool?.id;
    let shouldSeed = false;
    if (!poolId) {
      if (selectedFriendIds.length === 0) {
        setError("Please select a friend first.");
        setSpinState("idle");
        return;
      }
      setStatus("Creating pool...");
      const created = await createPool({ seedPool: false });
      poolId = created?.id;
      if (!poolId) {
        setError("Could not create pool.");
        setSpinState("idle");
        return;
      }
      shouldSeed = true;
    }
    if ((shouldSeed || !poolSeeded) && filteredIntersection.length > 0) {
      setStatus("Populating pool...");
      await addIntersectionToPool(poolId);
    }
    setPickResult("");
    setPickImage(null);
    setSpinState("spinning");
    setStatus("Selecting game...");
    try {
      const data = await client.pickFromPool(poolId, {
        mode: pickMode,
        avoidCount,
        appIds: wheelItems.map((g) => g.appid),
      });
      const pickedName = data.pick?.name;
      const pickedAppId = data.pick?.appId;
      if (pickedName) {
        setStatus("Wheel spinning...");
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
        setPickImage(
          picked
            ? `https://cdn.akamai.steamstatic.com/steam/apps/${picked.appid}/header.jpg`
            : null,
        );
        setPickPulse(true);
        setTimeout(() => setPickPulse(false), 1200);
        setSpinState("result");
      } else {
        setPickResult("No pick available.");
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
  }, [selectedFriendIds, intersection.length, pool?.id]);

  useEffect(() => {
    void refreshRecentAvoid();
  }, [refreshRecentAvoid]);

  return (
    <div className="space-y-8 animate-fade-in">
      <StatusSection
        user={user}
        authReady={authReady}
        isLoggedIn={isLoggedIn}
        canUseSteam={canUseSteam}
        loginFailed={loginFailed}
        isLoggingOut={isLoggingOut}
        myGamesCount={myGames.length}
        friendGamesCount={friendGames.length}
        intersectionCount={intersection.length}
        status={status}
        error={error}
        steamLoginUrl={client.steamLoginUrl}
        onLogout={logout}
        onLoadGames={fetchMyGames}
      />

      <FriendsSection
        friends={friends}
        friendSteamId={friendSteamId}
        selectedFriendIds={selectedFriendIds}
        friendFilter={friendFilter}
        canUseSteam={canUseSteam}
        canLoadShared={canLoadShared}
        onSetFriendSteamId={setFriendSteamId}
        onSetSelectedFriendIds={setSelectedFriendIds}
        onSetFriendFilter={setFriendFilter}
        onFetchFriendList={fetchFriendList}
        onAddFriend={addFriend}
        onDeleteFriend={(id) => void deleteFriend(id)}
        onFetchSharedGames={() => void fetchSelectedFriendsGames()}
      />

      <SharedGamesSection
        intersectionCount={intersection.length}
        previewGames={previewGames}
        onToggleTagPreset={toggleTagPreset}
      />

      <PickerSection
        pool={pool}
        poolSeeded={poolSeeded}
        pickMode={pickMode}
        avoidCount={avoidCount}
        spinSeconds={spinSeconds}
        spinState={spinState}
        pickResult={pickResult}
        pickImage={pickImage}
        pickPulse={pickPulse}
        wheelItems={wheelItems}
        spinningItem={spinningItem}
        canUseSteam={canUseSteam}
        canCreatePool={canCreatePool}
        canAddToPool={canAddToPool}
        canPick={canPick}
        isSpinBusy={isSpinBusy}
        pickDisabledReason={pickDisabledReason}
        wheelRef={wheelRef}
        onSetPickMode={setPickMode}
        onSetAvoidCount={setAvoidCount}
        onSetSpinSeconds={setSpinSeconds}
        onSetActiveWheelItem={setActiveWheelItem}
        onCreatePool={() => void createPool()}
        onAddToPool={() => void addIntersectionToPool()}
        onPickGame={() => void pickGame()}
      />

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">
          How it works
        </h2>
        <ol className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <li>1. Connect Steam and load your games.</li>
          <li>2. Select friends and find shared games.</li>
          <li>3. Create a pool and add games.</li>
          <li>4. Start the pick and play together.</li>
        </ol>
      </section>
    </div>
  );
}
