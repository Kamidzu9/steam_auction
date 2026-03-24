import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import PoolClient from "./PoolClient";

export default async function PoolPage({ params }: { params: { poolId: string } | Promise<{ poolId: string }> }) {
  const { poolId } = await Promise.resolve(params);
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/pools");
  }

  let pool: Awaited<ReturnType<typeof prisma.auctionPool.findFirst>> | undefined;
  try {
    pool = await prisma.auctionPool.findFirst({
      where: { id: poolId, ownerId: userId },
      include: {
        friend: true,
        games: { include: { game: true } },
        picks: { include: { game: true }, orderBy: { pickedAt: "desc" }, take: 5 },
      },
    }) ?? undefined;
  } catch {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <Link className="text-sm text-slate-400 hover:text-white" href="/pools">
            ← Zurück zu Pools
          </Link>
          <h1 className="font-display mt-3 text-2xl text-white">Datenbankfehler</h1>
          <p className="text-muted mt-2 text-sm">
            Datenbank nicht verfügbar. Bitte stelle sicher, dass die App korrekt eingerichtet ist.
          </p>
        </section>
      </div>
    );
  }

  if (!pool) {
    notFound();
  }

  const games = pool.games.map((pg) => ({
    appId: pg.game.appId,
    name: pg.game.name,
    storeUrl: pg.game.storeUrl,
    weight: pg.weight,
  }));

  return (
    <div className="space-y-5">
      <section className="surface rounded-2xl p-5">
        <Link className="text-xs text-slate-400 hover:text-white" href="/pools">
          ← Alle Pools
        </Link>
        <h1 className="font-display mt-3 text-xl text-white break-words">{pool.name}</h1>
        <p className="text-muted mt-1 text-sm">
          mit {pool.friend?.displayName ?? pool.friend?.steamId ?? "Unbekannt"}
          {" · "}{games.length} Spiele
        </p>
      </section>

      {games.length === 0 ? (
        <section className="surface rounded-2xl p-5">
          <p className="text-muted text-sm">
            Dieser Pool ist leer. Füge Spiele im Dashboard hinzu.
          </p>
          <Link
            href="/dashboard"
            className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
          >
            Zum Dashboard
          </Link>
        </section>
      ) : (
        <PoolClient poolId={pool.id} games={games} />
      )}

      {games.length > 0 && (
        <section className="surface rounded-2xl p-5">
          <h2 className="font-display text-base text-white">Alle Spiele im Pool</h2>
          <div className="mt-3 grid gap-1.5 md:grid-cols-2">
            {games.map((game) => (
              <a
                key={game.appId}
                href={game.storeUrl ?? `https://store.steampowered.com/app/${game.appId}`}
                className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 hover:border-white/25 break-words transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                {game.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {pool.picks.length > 0 && (
        <section className="surface rounded-2xl p-5">
          <h2 className="font-display text-base text-white">Letzte Picks</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
            {pool.picks.map((pick) => (
              <div key={pick.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="text-white font-medium">{pick.game?.name ?? "Unbekannt"}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {new Date(pick.pickedAt).toLocaleString("de-DE")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
