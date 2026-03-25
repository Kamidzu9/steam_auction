"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "../../lib/ApiProvider";
import type { UserPublic } from "@steam-auction/shared";

export default function ProfilePage() {
  const { client, isLoading, accessToken } = useApi();
  const [user, setUser] = useState<UserPublic | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    client.getMe().then((r) => setUser(r.user)).catch(() => setUser(null));
  }, [client, accessToken]);

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
          <h1 className="font-display text-2xl text-white">Profile</h1>
          <p className="text-muted mt-2 text-sm">
            Please log in to view your profile.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Profile</h1>

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
              No Avatar
            </div>
          )}

          <div>
            <div className="text-white font-semibold text-lg">{user?.displayName ?? "Unknown"}</div>
            <div className="text-sm text-slate-300 mt-1">Steam ID: {user?.steamId}</div>
          </div>
        </div>

        <div className="mt-4">
          <Link
            href="/settings"
            className="inline-flex rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white hover:border-white/20"
          >
            Go to Settings
          </Link>
        </div>
      </section>
    </div>
  );
}
