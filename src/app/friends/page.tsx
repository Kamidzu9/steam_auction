"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type User = {
  id: string;
  steamId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type Friend = {
  steamid: string;
};

type Profile = {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl?: string;
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

export default function FriendsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
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

  const loadFriends = useCallback(async (steamId: string) => {
    try {
      const data = await safeFetchJson<{ friends: Friend[]; profiles?: Profile[] }>(
        `/api/steam/friends?steamId=${encodeURIComponent(steamId)}`,
        { cache: "no-store" }
      );
      setFriends(data.friends ?? []);
      setProfiles(data.profiles ?? []);
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
          await loadFriends(userData.steamId);
        }
      } catch (err) {
        setFetchState("error");
        setErrorMessage(getErrorMessage(err));
      }
    }
    init();
  }, [loadUser, loadFriends]);

  const profilesMap = new Map(profiles.map(p => [p.steamid, p]));

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
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
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
          <h1 className="font-display text-2xl text-white">Freunde</h1>
          <p className="text-muted mt-2 text-sm">
            Du musst angemeldet sein, um deine Freundesliste zu sehen.
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
          <h1 className="font-display text-2xl text-white">Freunde</h1>
          <p className="text-muted mt-2 text-sm">Deine Steam-Freundesliste.</p>
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
            <h1 className="font-display text-xl text-white">Freunde</h1>
            {user?.displayName && (
              <p className="text-muted mt-1 text-sm">Angemeldet als {user.displayName}</p>
            )}
          </div>
          {friends.length > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              {friends.length} Freunde
            </span>
          )}
        </div>
      </section>

      <section className="surface rounded-2xl p-5">
        {friends.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted text-sm">
              Keine Freunde gefunden. Stelle sicher, dass deine Steam-Freundesliste oeffentlich ist.
            </p>
            <Link
              href="/dashboard"
              className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
            >
              Freunde im Dashboard laden
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => {
              const profile = profilesMap.get(friend.steamid);
              return (
                <div
                  key={friend.steamid}
                  className="card-animated min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    {profile?.avatarfull && (
                      <div className="flex-shrink-0">
                        <Image
                          src={profile.avatarfull}
                          alt={profile.personaname}
                          width={40}
                          height={40}
                          className="rounded-full"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm text-white truncate">
                        {profile?.personaname ?? friend.steamid}
                      </h3>
                      {profile?.profileurl && (
                        <a
                          href={profile.profileurl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Profil ansehen →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
