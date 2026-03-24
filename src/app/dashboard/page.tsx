import Link from "next/link";
import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

function DashboardFallback() {
  return (
    <div className="surface rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
      <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
      <div className="h-4 w-3/4 bg-white/10 rounded"></div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
        <h1 className="font-display text-3xl text-white md:text-4xl">Steuere deinen Auction Flow</h1>
        <p className="text-muted max-w-2xl text-sm">
          Verbinde Steam, waehle Freunde, erstelle einen gemeinsamen Pool und lass die
          Auktion ein Spiel aussuchen.
        </p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span className="rounded-full border border-white/10 px-3 py-1">Login</span>
          <span className="rounded-full border border-white/10 px-3 py-1">Intersection</span>
          <span className="rounded-full border border-white/10 px-3 py-1">Pick</span>
        </div>
      </header>

      <Suspense fallback={<DashboardFallback />}>
        <DashboardClient />
      </Suspense>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">Schnellstart</h2>
        <p className="text-muted mt-2 text-sm">
          Starte direkt mit einem Beispielpool oder springe in die Hilfe, wenn du Details
          zu Steam Privacy brauchst.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="btn-animated rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30"
            href="/pools"
          >
            Meine Pools
          </Link>
          <Link
            className="btn-animated rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30"
            href="/help"
          >
            Hilfe & Tipps
          </Link>
        </div>
      </section>
    </div>
  );
}
