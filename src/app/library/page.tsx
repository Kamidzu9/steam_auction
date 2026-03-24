"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type User = {
  id: string;
  steamId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type Game = {
  appid: number;
  name: string;
  playtime_forever?: number;
};

type FetchState = "loading" | "success" | "error" | "unauthorized";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Request failed";
}

async function safeFetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  const data = await res.json().catch(() => ({})) as T & { error?: string };
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Request failed";
    throw new Error(message);
  }
  return data;
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 100) {
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${hours}h`;
}

export default function LibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const loadUser = useCallback(async () => {
    try {
      const data = await safeFetchJson<{ user: User | null }>("/api/me", { cache: "no-store" });
      if (!data.user) {
        router.push("/dashboard");
        return null;
      }
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (getErrorMessage(err) === "UNAUTHORIZED") {
        router.push("/dashboard");
        return null;
      }
      throw err;
    }
  }, [router]);

  const loadGames = useCallback(async (steamId: string) => {
    try {
      const data = await safeFetchJson<{ games: Game[] }>(
        `/api/steam/owned-games?steamId=${encodeURIComponent(steamId)}`,
        { cache: "no-store" }
      );
      setGames(data.games ?? []);
      setFetchState("success");
    } catch (err) {
      if (getErrorMessage(err) === "UNAUTHORIZED") {
        setFetchState("unauthorized");
      } else {
        setFetchState("error");
        setErrorMessage(getErrorMessage(err));
      }
    }
  }, []);

  useEffect(() => {
    async function init() {
      setFetchState("loading");
      try {
        const userData = await loadUser();
        if (userData?.steamId) {
          await loadGames(userData.steamId);
        }
      } catch (err) {
        setFetchState("error");
        setErrorMessage(getErrorMessage(err));
      }
    }
    init();
  }, [loadUser, loadGames]);

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
          <h1 className="font-display text-2xl text-white">Bibliothek</h1>
          <p className="text-muted mt-2 text-sm">
            Du musst angemeldet sein, um deine Spielebibliothek zu sehen.
          </p>
          <a
            href="/api/auth/steam"
            className="btn-animated mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(245,158,11,0.2)] hover:scale-[1.02]"
          >
            Mit Steam verbinden
          </a>
        </section>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Bibliothek</h1>
          <p className="text-muted mt-2 text-sm">Deine Steam-Spielebibliothek.</p>
          <p className="mt-4 text-sm text-rose-300">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-animated mt-3 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
          >
            Erneut versuchen
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="surface rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl text-white">Bibliothek</h1>
            {user?.displayName && (
              <p className="text-muted mt-1 text-sm">Angemeldet als {user.displayName}</p>
            )}
          </div>
          {games.length > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              {games.length} Spiele
            </span>
          )}
        </div>
      </section>

      <section className="surface rounded-2xl p-5">
        {games.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted text-sm">
              Keine Spiele gefunden. Stelle sicher, dass dein Steam-Profil oeffentlich ist.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <a
                key={game.appid}
                href={`https://store.steampowered.com/app/${game.appid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card-animated group min-w-0 rounded-2xl border border-white/10 bg-black/20 p-3 text-left hover:border-white/30 transition-all"
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
                    <h3 className="font-display text-sm text-white break-words line-clamp-2 group-hover:text-slate-200 transition-colors">
                      {game.name}
                    </h3>
                    {game.playtime_forever !== undefined && game.playtime_forever > 0 ? (
                      <p className="text-xs text-slate-400 mt-1">
                        {formatPlaytime(game.playtime_forever)} gespielt
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 mt-1">Noch nicht gespielt</p>
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
