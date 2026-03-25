"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApi } from "../../lib/ApiProvider";
import PoolClient from "./PoolClient";
import type { AuctionPool } from "@steam-auction/shared";

type PoolGame = {
  appId: number;
  name: string;
  storeUrl?: string | null;
  weight?: number;
};

type PickEntry = {
  id: string;
  pickedAt: string;
  mode: string;
  avoidCount?: number | null;
  game?: { name: string } | null;
};

type PoolDetail = AuctionPool & {
  picks?: PickEntry[];
};

export default function PoolsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <section className="surface rounded-2xl p-6 animate-pulse">
            <div className="h-8 w-48 bg-white/10 rounded mb-4" />
            <div className="h-4 w-full bg-white/10 rounded mb-2" />
          </section>
        </div>
      }
    >
      <PoolsPageContent />
    </Suspense>
  );
}

function PoolsPageContent() {
  const searchParams = useSearchParams();
  const poolId = searchParams.get("poolId") ?? undefined;
  const { client, accessToken, isLoading } = useApi();
  const [pools, setPools] = useState<AuctionPool[]>([]);
  const [pool, setPool] = useState<PoolDetail | null>(null);
  const [games, setGames] = useState<PoolGame[]>([]);
  const [fetchState, setFetchState] = useState<
    "loading" | "done" | "notfound" | "error"
  >("loading");

  useEffect(() => {
    if (isLoading) return;
    if (!accessToken) {
      setFetchState("done");
      return;
    }

    client
      .getPools()
      .then((r) => {
        setPools(r.pools);

        if (poolId) {
          const found = r.pools.find((p) => p.id === poolId) as
            | PoolDetail
            | undefined;
          if (!found) {
            setFetchState("notfound");
            return;
          }
          setPool(found);
          setGames(
            (found.games ?? []).map((pg) => ({
              appId: pg.game?.appId ?? 0,
              name: pg.game?.name ?? "Unknown",
              storeUrl: pg.game?.storeUrl,
              weight: pg.weight,
            })),
          );
        }
        setFetchState("done");
      })
      .catch(() => setFetchState("error"));
  }, [client, accessToken, isLoading, poolId]);

  if (poolId) {
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

    if (
      fetchState === "notfound" ||
      (!isLoading && !pool && fetchState === "done")
    ) {
      return (
        <div className="space-y-6">
          <section className="surface rounded-2xl p-6">
            <Link
              className="text-sm text-slate-400 hover:text-white"
              href="/pools"
            >
              Back to Pools
            </Link>
            <h1 className="font-display mt-3 text-2xl text-white">
              Pool not found
            </h1>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <Link
            className="text-sm text-slate-400 hover:text-white"
            href="/pools"
          >
            Back to Pools
          </Link>
          <h1 className="font-display mt-3 text-2xl text-white break-words">
            {pool?.name}
          </h1>
          <p className="text-muted mt-2 text-sm break-words">
            Friend:{" "}
            {pool?.friend?.displayName ?? pool?.friend?.steamId ?? "Unknown"}
          </p>
          <p className="text-muted mt-1 text-sm">Games: {games.length}</p>
          <p className="text-muted mt-1 text-sm">
            Created:{" "}
            {pool?.createdAt
              ? new Date(pool.createdAt).toLocaleDateString("en-US")
              : ""}
          </p>
        </section>

        {games.length === 0 ? (
          <section className="surface rounded-2xl p-6">
            <p className="text-muted text-sm">
              This pool is empty. Add games from the Dashboard.
            </p>
          </section>
        ) : (
          <PoolClient poolId={poolId} games={games} />
        )}

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-lg text-white">Pool Games</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {games.map((game) => (
              <a
                key={game.appId}
                href={
                  game.storeUrl ??
                  `https://store.steampowered.com/app/${game.appId}`
                }
                className="min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200 hover:border-white/30 break-words"
                target="_blank"
                rel="noreferrer"
              >
                {game.name}
              </a>
            ))}
          </div>
        </section>

        {pool?.picks && pool.picks.length > 0 ? (
          <section className="surface rounded-2xl p-6">
            <h2 className="font-display text-lg text-white">Recent Picks</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              {pool.picks.map((pick) => (
                <div
                  key={pick.id}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                >
                  <div className="text-white">
                    {pick.game?.name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(pick.pickedAt).toLocaleString("en-US")} •{" "}
                    {pick.mode}
                    {pick.mode === "avoid" && pick.avoidCount
                      ? ` (avoid ${pick.avoidCount})`
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

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
          <h1 className="font-display text-2xl text-white">Your Pools</h1>
          <p className="text-muted mt-2 text-sm">
            Please log in to view your pools.
          </p>
          <Link
            href="/dashboard"
            className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
          >
            Go to Dashboard
          </Link>
        </section>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Error</h1>
          <p className="text-muted mt-2 text-sm">
            An error occurred while loading pools.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Your Pools</h1>
        {pools.length === 0 ? (
          <p className="text-muted mt-2 text-sm">
            No pools yet. Create your first pool from the Dashboard.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {pools.map((p) => (
              <Link
                key={p.id}
                href={`/pools?poolId=${encodeURIComponent(p.id)}`}
                className="card-animated min-w-0 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-sm text-slate-200 hover:border-white/30"
              >
                <div className="font-display text-base text-white break-words">
                  {p.name}
                </div>
                <div className="mt-2 text-xs text-slate-400 truncate">
                  Friend:{" "}
                  {p.friend?.displayName ?? p.friend?.steamId ?? "Unknown"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Games: {p.games?.length ?? 0}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
