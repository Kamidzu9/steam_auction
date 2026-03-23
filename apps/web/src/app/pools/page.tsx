"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "../../lib/ApiProvider";
import type { AuctionPool } from "@steam-auction/shared";

export default function PoolsPage() {
  const { client, accessToken, isLoading } = useApi();
  const [pools, setPools] = useState<AuctionPool[]>([]);
  const [fetchState, setFetchState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (isLoading) return;
    if (!accessToken) {
      setFetchState("done");
      return;
    }
    client.getPools()
      .then((r) => { setPools(r.pools); setFetchState("done"); })
      .catch(() => setFetchState("error"));
  }, [client, accessToken, isLoading]);

  if (fetchState === "loading" || isLoading) {
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
          <h1 className="font-display text-2xl text-white">Deine Pools</h1>
          <p className="text-muted mt-2 text-sm">
            Bitte anmelden, um deine Pools zu sehen.
          </p>
          <Link href="/dashboard" className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40">
            Zum Dashboard
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Deine Pools</h1>
        <p className="text-muted mt-2 text-sm">
          Verwalte deine vorhandenen Auction Pools oder gehe zurueck zum Dashboard.
        </p>
        <Link
          href="/dashboard"
          className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
        >
          Zum Dashboard
        </Link>
      </section>

      <section className="surface rounded-2xl p-6">
        {pools.length === 0 ? (
          <p className="text-muted text-sm">
            Noch keine Pools vorhanden. Erstelle deinen ersten Pool im Dashboard.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pools.map((pool) => (
              <Link
                key={pool.id}
                href={`/pools/${pool.id}`}
                className="card-animated min-w-0 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-sm text-slate-200 hover:border-white/30"
              >
                <div className="font-display text-base text-white break-words">{pool.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {(pool.games?.length ?? 0)} Spiel{pool.games?.length !== 1 ? "e" : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

