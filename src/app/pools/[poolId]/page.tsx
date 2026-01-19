import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PoolClient from "./PoolClient";

export default async function PoolPage({ params }: { params: { poolId: string } }) {
  const { poolId } = params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    redirect("/dashboard");
  }

  const pool = await prisma.auctionPool.findFirst({
    where: { id: poolId, ownerId: userId },
    include: {
      friend: true,
      games: { include: { game: true } },
      picks: { include: { game: true }, orderBy: { pickedAt: "desc" }, take: 5 },
    },
  });

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
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <Link className="text-sm text-slate-400 hover:text-white" href="/pools">
          Back to Pools
        </Link>
        <h1 className="font-display mt-3 text-2xl text-white break-words">{pool.name}</h1>
        <p className="text-muted mt-2 text-sm break-words">
          Friend: {pool.friend?.displayName ?? pool.friend?.steamId ?? "Unknown"}
        </p>
        <p className="text-muted mt-1 text-sm">Games: {games.length}</p>
      </section>

      {games.length === 0 ? (
        <section className="surface rounded-2xl p-6">
          <p className="text-muted text-sm">
            Dieser Pool ist leer. Fuege Spiele im Dashboard hinzu.
          </p>
        </section>
      ) : (
        <PoolClient poolId={pool.id} games={games} />
      )}

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">Pool Games</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {games.map((game) => (
            <a
              key={game.appId}
              href={game.storeUrl ?? `https://store.steampowered.com/app/${game.appId}`}
              className="min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200 hover:border-white/30 break-words"
              target="_blank"
              rel="noreferrer"
            >
              {game.name}
            </a>
          ))}
        </div>
      </section>

      {pool.picks.length > 0 ? (
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-lg text-white">Letzte Picks</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
            {pool.picks.map((pick) => (
              <div key={pick.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                {pick.game?.name ?? "Unknown"}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
