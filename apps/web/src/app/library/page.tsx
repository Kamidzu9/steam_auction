"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useApi } from "../../lib/ApiProvider";
import { ApiError } from "@steam-auction/api-client";

type Game = {
  appid: number;
  name: string;
  playtime_forever?: number;
};

type FetchState = "loading" | "success" | "error" | "unauthorized";

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 100) {
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${hours}h`;
}

export default function LibraryPage() {
  const { client, accessToken, isLoading: authLoading } = useApi();
  const [games, setGames] = useState<Game[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const loadGames = useCallback(async (steamId: string) => {
    try {
      const data = await client.getOwnedGames(steamId);
      setGames((data.games ?? []).map((g) => ({ appid: g.appid, name: g.name, playtime_forever: g.playtime_forever })));
      setFetchState("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFetchState("unauthorized");
      } else {
        setFetchState("error");
        setErrorMessage(getErrorMessage(err));
      }
    }
  }, [client]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) { setFetchState("unauthorized"); return; }

    setFetchState("loading");
    client.getMe()
      .then((r) => {
        if (r.user?.steamId) return loadGames(r.user.steamId);
        setFetchState("unauthorized");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setFetchState("unauthorized");
        else { setFetchState("error"); setErrorMessage(getErrorMessage(err)); }
      });
  }, [client, accessToken, authLoading, loadGames]);

  if (fetchState === "loading") {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6 animate-pulse">
          <div className="h-8 w-48 bg-white/10 rounded mb-4"></div>
          <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
          <div className="h-4 w-3/4 bg-white/10 rounded"></div>
        </section>
        <section className="surface rounded-2xl p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (fetchState === "unauthorized") {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Library</h1>
          <p className="text-muted mt-2 text-sm">
            You need to be logged in to view your library.
          </p>
        </section>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Library</h1>
          <p className="text-muted mt-2 text-sm">
            Your Steam owned games library.
          </p>
        </section>
        <section className="surface rounded-2xl p-6">
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-4">Error loading games: {errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-animated rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
            >
              Retry
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Library</h1>
        <p className="text-muted mt-2 text-sm">
          Your Steam owned games library.
        </p>
        {games.length > 0 && (
          <p className="text-muted mt-1 text-xs">
            {games.length} game{games.length !== 1 ? "s" : ""} found
          </p>
        )}
      </section>

      <section className="surface rounded-2xl p-6">
        {games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm">
              No games found in your library. Make sure your Steam profile is public.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <a
                key={game.appid}
                href={`https://store.steampowered.com/app/${game.appid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card-animated group min-w-0 rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Image
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_sm_120.jpg`}
                      alt={game.name}
                      width={60}
                      height={45}
                      className="rounded object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm text-white break-words line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {game.name}
                    </h3>
                    {game.playtime_forever !== undefined && game.playtime_forever > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Played: {formatPlaytime(game.playtime_forever)}
                      </p>
                    )}
                    {(!game.playtime_forever || game.playtime_forever === 0) && (
                      <p className="text-xs text-slate-500 mt-1">
                        Not played
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
