"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApi } from "../../lib/ApiProvider";
import { ApiError } from "@steam-auction/api-client";

type Profile = {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl?: string;
};

type FetchState = "loading" | "success" | "error" | "unauthorized";

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export default function FriendsPage() {
  const { client, accessToken, isLoading: authLoading } = useApi();
  const [friends, setFriends] = useState<{ steamid: string }[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const loadFriends = useCallback(async (steamId: string) => {
    try {
      const data = await client.getSteamFriends(steamId);
      setFriends(data.friends ?? []);
      setProfiles((data.profiles ?? []) as Profile[]);
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
        if (r.user?.steamId) return loadFriends(r.user.steamId);
        setFetchState("unauthorized");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setFetchState("unauthorized");
        else { setFetchState("error"); setErrorMessage(getErrorMessage(err)); }
      });
  }, [client, accessToken, authLoading, loadFriends]);

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
          <h1 className="font-display text-2xl text-white">Friends</h1>
          <p className="text-muted mt-2 text-sm">
            You need to be logged in to view your friends.
          </p>
        </section>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Friends</h1>
          <p className="text-muted mt-2 text-sm">
            Your Steam friends list.
          </p>
        </section>
        <section className="surface rounded-2xl p-6">
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-4">Error loading friends: {errorMessage}</p>
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
        <h1 className="font-display text-2xl text-white">Friends</h1>
        <p className="text-muted mt-2 text-sm">
          Your Steam friends.
        </p>
        {friends.length > 0 && (
          <p className="text-muted mt-1 text-xs">
            {friends.length} friend{friends.length !== 1 ? "s" : ""} found
          </p>
        )}
        <Link
          href="/dashboard"
          className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
        >
          Create Pool with Friends
        </Link>
      </section>

      <section className="surface rounded-2xl p-6">
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted text-sm">
              No friends found. Make sure your Steam friends list is public.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => {
              const profile = profilesMap.get(friend.steamid);
              return (
                <div
                  key={friend.steamid}
                  className="card-animated min-w-0 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    {profile?.avatarfull && (
                      <div className="flex-shrink-0">
                        <Image
                          src={profile.avatarfull}
                          alt={profile.personaname}
                          width={48}
                          height={48}
                          className="rounded-full"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm text-white truncate">
                        {profile?.personaname ?? friend.steamid}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {friend.steamid}
                      </p>
                      {profile?.profileurl && (
                        <a
                          href={profile.profileurl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Profile →
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
