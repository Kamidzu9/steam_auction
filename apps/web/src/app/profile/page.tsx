"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useApi } from "../../lib/ApiProvider";
import type { UserPublic } from "@steam-auction/shared";

export default function ProfilePage() {
  const { client, setAccessToken, isLoading, accessToken } = useApi();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    client.getMe().then((r) => setUser(r.user)).catch(() => setUser(null));
  }, [client, accessToken]);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await client.logout();
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6 animate-pulse">
          <div className="h-8 w-48 bg-white/10 rounded mb-4" />
          <div className="h-4 w-full bg-white/10 rounded mb-2" />
        </section>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Profil</h1>
          <p className="text-muted mt-2 text-sm">
            Bitte anmelden, um dein Profil zu sehen.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Profil</h1>
        <p className="text-muted mt-2 text-sm">Hier findest du deine Account-Details.</p>

        <div className="mt-4 flex items-center gap-4">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName ?? "Avatar"}
              width={96}
              height={96}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-sm text-slate-300">
              Kein Avatar
            </div>
          )}

          <div>
            <div className="text-white font-semibold text-lg">{user?.displayName ?? "Unbekannt"}</div>
            <div className="text-sm text-slate-300 mt-1">SteamID: {user?.steamId}</div>
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="mt-3 inline-block rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
