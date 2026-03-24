import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export default async function PoolsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Deine Pools</h1>
          <p className="text-muted mt-2 text-sm">
            Bitte mit Steam anmelden, um Pools zu sehen und zu verwalten.
          </p>
          <a
            href="/api/auth/steam"
            className="btn-animated mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
          >
            Mit Steam anmelden
          </a>
        </section>
      </div>
    );
  }

  let pools: Awaited<ReturnType<typeof prisma.auctionPool.findMany>> = [];
  try {
    pools = await prisma.auctionPool.findMany({
      where: { ownerId: userId },
      include: {
        friend: true,
        games: true,
        picks: { include: { game: true }, orderBy: { pickedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Deine Pools</h1>
          <p className="text-muted mt-2 text-sm">
            Datenbank nicht verfügbar. Bitte stelle sicher, dass die App korrekt eingerichtet ist.
          </p>
          <Link
            href="/help"
            className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
          >
            Hilfe & Setup
          </Link>
        </section>
      </div>
    );
  }

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
