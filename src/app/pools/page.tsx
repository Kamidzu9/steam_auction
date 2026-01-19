import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PoolsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    redirect("/dashboard");
  }

  const pools = await prisma.auctionPool.findMany({
    where: { ownerId: userId },
    include: { friend: true, games: true },
    orderBy: { createdAt: "desc" },
  });

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
                <div className="mt-2 text-xs text-slate-400 truncate">
                  Friend: {pool.friend?.displayName ?? pool.friend?.steamId ?? "Unknown"}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Games: {pool.games.length}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
