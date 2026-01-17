"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuctionWheel, { AuctionWheelHandle } from "../../components/AuctionWheel";

type User = {
  id: string;
  steamId: string;
  displayName?: string | null;
};

type GameItem = {
  appid: number;
  name: string;
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

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [myGames, setMyGames] = useState<GameItem[]>([]);
  const [friendGames, setFriendGames] = useState<GameItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [gameTagsMap, setGameTagsMap] = useState<Record<number, string[]>>({});
  const [tagsLoading, setTagsLoading] = useState<Record<number, boolean>>({});
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

  useEffect(() => {
    void loadUser();
    void loadFriends();
  }, []);

  useEffect(() => {
    if (!user?.steamId || autoSyncRef.current) return;
    autoSyncRef.current = true;
    void fetchMyGames();
    void fetchFriendList();
  }, [user?.steamId]);

  async function loadUser() {
    const res = await fetch("/api/me");
    const data = (await res.json()) as { user: User | null };
    setUser(data.user);
  }

  async function loadFriends() {
    const res = await fetch("/api/friends");
    const data = (await res.json()) as { friends: Friend[] };
    setFriends(data.friends ?? []);
  }

  async function fetchMyGames() {
    if (!user?.steamId) return;
    setStatus("Loading your games...");
    setError("");
    const res = await fetch(`/api/steam/owned-games?steamId=${user.steamId}`);
    const data = (await res.json()) as { games?: GameItem[]; error?: string };
    if (data.error) {
      setError(data.error);
    }
    const games = data.games ?? [];
    if (!data.error && games.length === 0) {
      setError("No games returned. Check Steam privacy settings");
    }
    setMyGames(games);
    setStatus("");
  }

  async function fetchFriendList() {
    if (!user?.steamId) return;
    setStatus("Loading Steam friends...");
    setError("");
    const res = await fetch(`/api/steam/friends?steamId=${user.steamId}`);
    const data = (await res.json()) as {
      friends?: { steamid: string }[];
      profiles?: SteamProfile[];
      error?: string;
    };
    if (data.error) {
      setError(data.error);
    }
    const profiles = data.profiles ?? [];
    if (profiles.length) {
      const payload = profiles.slice(0, 200).map((profile) => ({
        steamId: profile.steamid,
        displayName: profile.personaname,
      }));
      await fetch("/api/friends/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friends: payload }),
      });
    }
    await loadFriends();
    setStatus(
      data.friends?.length
        ? "Friend list loaded and saved."
        : "No public friends list."
    );
  }

  async function addFriend() {
    if (!friendSteamId) return;
    setStatus("Saving friend...");
    setError("");
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId: friendSteamId }),
    });
    setFriendSteamId("");
    await loadFriends();
    setStatus("");
  }

  async function fetchSelectedFriendsGames() {
    if (selectedFriendIds.length === 0) return;
    if (!user?.steamId) return;
    setStatus("Loading selected friends' games...");
    setError("");

    try {
      let sharedAppIds: Set<number> | null = null;

      for (const friendId of selectedFriendIds) {
        const friend = friends.find((f) => f.id === friendId);
        if (!friend?.steamId) continue;
        const res = await fetch(`/api/steam/owned-games?steamId=${friend.steamId}`);
        const data = (await res.json()) as { games?: GameItem[]; error?: string };
        if (data.error) {
          setError(data.error);
          continue;
        }
        const games = data.games ?? [];
        const appSet = new Set(games.map((g) => g.appid));
        if (sharedAppIds === null) sharedAppIds = appSet;
        else {
          sharedAppIds = new Set(Array.from(sharedAppIds as Set<number>).filter((id) => appSet.has(id)));
        }
      }

      const mySet = new Set(myGames.map((g) => g.appid));
      const finalIds = sharedAppIds ? [...sharedAppIds].filter((id) => mySet.has(id)) : [];
      const finalGames = myGames.filter((g) => finalIds.includes(g.appid));
      setFriendGames(finalGames);
      // start fetching tags for intersection in background
      void prefetchTagsForGames(finalGames);
      setStatus(finalGames.length ? "Shared games loaded." : "No shared games found.");
    } catch (err) {
      setError("Failed to load friend games");
    }
  }

  async function fetchGameTags(appid: number) {
    // cached?
    if (gameTagsMap[appid]) return gameTagsMap[appid];
    setTagsLoading((s) => ({ ...s, [appid]: true }));
    try {
      const res = await fetch(`/api/steam/app-details?appId=${appid}`);
      const data = await res.json();
      const tags: string[] = [];
      if (Array.isArray(data.categories)) tags.push(...data.categories.map((t: string) => t.toLowerCase()));
      if (Array.isArray(data.genres)) tags.push(...data.genres.map((t: string) => t.toLowerCase()));
      const dedup = Array.from(new Set(tags));
      setGameTagsMap((s) => ({ ...s, [appid]: dedup }));
      return dedup;
    } catch (e) {
      return [];
    } finally {
      setTagsLoading((s) => ({ ...s, [appid]: false }));
    }
  }

  function prefetchTagsForGames(games: GameItem[]) {
    for (const g of games) {
      if (!gameTagsMap[g.appid]) void fetchGameTags(g.appid);
    }
  }

  const intersection = useMemo(() => {
    const myMap = new Map(myGames.map((g) => [g.appid, g]));
    return friendGames.filter((g) => myMap.has(g.appid));
  }, [myGames, friendGames]);

  const commonTagOptions = [
    "coop",
    "multiplayer",
    "single-player",
    "online co-op",
    "local co-op",
  ];

  const filteredIntersection = useMemo(() => {
    if (!selectedTags.length) return intersection;
    return intersection.filter((g) => {
      const tags = gameTagsMap[g.appid] ?? [];
      // if tags not fetched yet, exclude until fetched
      if (!tags || tags.length === 0) return false;
      return selectedTags.every((t) => tags.includes(t.toLowerCase()));
    });
  }, [intersection, selectedTags, gameTagsMap]);

  async function createPool() {
    if (selectedFriendIds.length === 0) return;
    setStatus("Creating pool...");
    setError("");
    const firstFriend = selectedFriendIds[0];
    const res = await fetch("/api/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId: firstFriend, name: "Auction Pool" }),
    });
    const data = (await res.json()) as { pool: Pool };
    setPool(data.pool);
    if (intersection.length > 0) {
      await addIntersectionToPool(data.pool.id);
    } else {
      setStatus("Pool created. No shared games yet.");
    }
  }

  async function addIntersectionToPool(poolIdOverride?: string) {
    const poolId = poolIdOverride ?? pool?.id;
    if (!poolId || intersection.length === 0) return;
    setStatus("Adding shared games to pool...");
    setError("");
    let skipped = 0;
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
        const data = await res.json();
        if (data?.skipped) {
          skipped++;
          skippedNames.push(game.name);
        }
      } catch (e) {
        // ignore individual failures
      }
    }

    setPoolSeeded(true);
    setStatus(skipped ? `Pool updated. Skipped ${skipped} forbidden titles.` : "Pool updated.");
    if (skippedNames.length > 0) {
      setError(`Skipped: ${skippedNames.slice(0,5).join(", ")}${
        skippedNames.length > 5 ? ` (+${skippedNames.length - 5} more)` : ""
      }`);
    }
  }

  async function pickGame() {
    if (!pool?.id) return;
    setStatus("Picking a game...");
    setError("");
    const res = await fetch(`/api/pools/${pool.id}/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: pickMode, avoidCount }),
    });
    const data = (await res.json()) as { pick?: { name: string; appId?: number }; error?: string };
    if (data.error) {
      setError(data.error);
    }
    const pickedName = data.pick?.name;
    const pickedAppId = data.pick?.appId;
    if (pickedName) {
      setStatus("Spinning the wheel...");
      if (pickedAppId && wheelRef.current) {
        try {
          const durationMs = Math.max(200, Math.round(spinSeconds * 1000));
          await wheelRef.current.spinTo(pickedAppId, durationMs);
        } catch (e) {
          // ignore spin errors
        }
      }
      setPickResult(pickedName);
      const picked = intersection.find((g) => g.appid === pickedAppId);
      setPickImage(picked ? `https://cdn.akamai.steamstatic.com/steam/apps/${picked.appid}/header.jpg` : null);
      setPickPulse(true);
      setTimeout(() => setPickPulse(false), 1200);
    } else {
      setPickResult("No pick available");
    }
    setStatus("");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Status</h2>
        <p className="mt-2 text-sm text-slate-400">
          {user?.steamId
            ? `Logged in as ${user.steamId}`
            : "Not logged in. Use Steam login first."}
        </p>
        {status ? (
          <p className="mt-2 text-sm text-slate-300 animate-slide-up">{status}</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-rose-300 animate-slide-up">
            {error}. Ensure Steam profile is public.
          </p>
        ) : null}
        <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-3 animate-slide-up">
          <span>My games: {myGames.length}</span>
          <span>Friend games: {friendGames.length}</span>
          <span>Shared games: {intersection.length}</span>
        </div>
        <button
          className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 btn-animated transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={fetchMyGames}
          disabled={!user?.steamId}
        >
          Fetch My Games
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 card-animated animate-pop">
        <h2 className="text-lg font-semibold">Friends</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            id="btn-load-friends"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 btn-animated transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={fetchFriendList}
            disabled={!user?.steamId}
          >
            Load Steam Friends (public)
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="w-60 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Friend SteamID"
            value={friendSteamId}
            onChange={(event) => setFriendSteamId(event.target.value)}
          />
          <button
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 btn-animated transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={addFriend}
          >
            Save Friend
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <input
              placeholder="Find friend by name..."
              value={friendFilter}
              onChange={(e) => setFriendFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm mb-2"
            />
            <div id="friends-list" className="h-40 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-2">
              {friends.length === 0 ? (
                <div className="text-sm text-slate-400 p-2">No saved friends.</div>
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
                    <label
                      key={friend.id}
                      className="flex items-center gap-3 rounded p-2 hover:bg-slate-900"
                    >
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
                      <div className="text-sm text-slate-200">
                        {friend.displayName ?? friend.steamId}
                      </div>
                    </label>
                  ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 btn-animated"
                onClick={() => setSelectedFriendIds(friends.map((f) => f.id))}
              >
                Select All
              </button>
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 btn-animated"
                onClick={() => setSelectedFriendIds([])}
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2">
              <button
                id="btn-load-shared"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 btn-animated"
                onClick={() => void fetchSelectedFriendsGames()}
                disabled={selectedFriendIds.length === 0}
              >
                Load Shared Games
              </button>
            </div>
          </div>
        </div>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No saved friends yet. Load public friends or add a SteamID.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 card-animated animate-pop">
        <h2 className="text-lg font-semibold">Intersection & Pool</h2>
        <p className="mt-2 text-sm text-slate-400">
          Shared games: {intersection.length}
        </p>
        <div className="mt-3">
          <label className="text-sm text-slate-300">Filter by tags:</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {commonTagOptions.map((t) => (
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
        {filteredIntersection.length > 0 ? (
          <>
            <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">Mode:</label>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={pickMode}
                  onChange={(e) => setPickMode(e.target.value as "pure" | "avoid")}
                >
                  <option value="pure">Pure random</option>
                  <option value="avoid">Avoid repeats</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">Avoid:</label>
                <input
                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  type="number"
                  min={1}
                  value={avoidCount}
                  onChange={(e) => setAvoidCount(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">Spin (s):</label>
                <input
                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  type="number"
                  step={0.1}
                  min={0.5}
                  value={spinSeconds}
                  onChange={(e) => setSpinSeconds(Number(e.target.value))}
                />
              </div>

              <button
                id="btn-pick-game"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 btn-animated"
                onClick={pickGame}
                disabled={!pool?.id}
              >
                Pick Game
              </button>
            </div>

              <div id="wheel" className="mt-4 flex items-center justify-center">
              <AuctionWheel
                ref={wheelRef}
                items={filteredIntersection.map((g) => ({ appid: g.appid, name: g.name }))}
              />
            </div>

            {pickResult ? (
              <div
                className={`mt-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition ${
                  pickPulse ? "animate-reveal-pick animate-pulse-once" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {pickImage ? (
                    <img
                      src={pickImage}
                      alt={pickResult}
                      className="h-16 w-28 rounded-md object-cover shadow-md"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (!t.src.includes("header.jpg")) {
                          t.src = `https://cdn.akamai.steamstatic.com/steam/apps/0/header.jpg`;
                        }
                      }}
                    />
                  ) : null}
                  <div>
                    <div className="text-sm">Result:</div>
                    <div className="text-lg font-semibold">{pickResult}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            id="btn-create-pool"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 btn-animated transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={createPool}
            disabled={selectedFriendIds.length === 0}
          >
            Create Pool
          </button>
          <button
            id="btn-add-shared"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 btn-animated transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={() => void addIntersectionToPool()}
            disabled={!pool?.id || intersection.length === 0}
          >
            Add Shared Games to Pool
          </button>
        </div>
        {pool?.id ? (
          <p className="mt-3 text-sm text-slate-400">
            Pool ID: {pool.id} {poolSeeded ? "(seeded)" : ""}
          </p>
        ) : null}
        <div className="mt-3 text-sm text-slate-400">
          <p>
            Pools store a shared collection of games between you and a friend. Create
            a pool first and seed it with shared games so picks are persisted and
            shared across devices.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            The <strong>Avoid</strong> value excludes that many recent picks from selection.
            <span className="ml-2">Spin duration controls how long the wheel animation runs.</span>
          </p>
        </div>
      </div>

      
    </div>
  );
}
