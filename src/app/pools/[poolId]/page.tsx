import Link from "next/link";

export default async function PoolPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Link className="text-sm text-slate-400" href="/dashboard">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold">Auction Pool: {poolId}</h1>
        <p className="text-sm text-slate-400">
          Use API routes to add games and pick a random title.
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">API Examples</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
            <li>POST /api/pools (create pool)</li>
            <li>POST /api/pools/{poolId}/games (add game)</li>
            <li>POST /api/pools/{poolId}/pick (random pick)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
