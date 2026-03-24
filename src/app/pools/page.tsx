import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export default async function PoolsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/dashboard");
  }

  const pools = await prisma.auctionPool.findMany({
    where: { ownerId: userId },
    include: {
      friend: true,
      games: true,
      picks: { include: { game: true }, orderBy: { pickedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <section className="surface rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl text-white">Deine Pools</h1>
          <Link
            href="/dashboard"
            className="btn-animated text-xs text-slate-400 hover:text-white"
          >
            + Neuen Pool erstellen
          </Link>
        </div>
      </section>

      <section className="surface rounded-2xl p-5">
        {pools.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted text-sm mb-4">
              Noch keine Pools vorhanden.
            </p>
            <Link
              href="/dashboard"
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
            >
              Ersten Pool erstellen
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pools.map((pool) => (
              <Link
                key={pool.id}
                href={`/pools/${pool.id}`}
                className="card-animated min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/25 transition-all"
              >
                <div className="font-display text-base text-white break-words">{pool.name}</div>
                <div className="mt-1.5 text-xs text-slate-400 truncate">
                  mit {pool.friend?.displayName ?? pool.friend?.steamId ?? "Unbekannt"}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{pool.games.length} Spiele</span>
                  <span>·</span>
                  <span>Letzter Pick: {pool.picks[0]?.game?.name ?? "Noch keiner"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
