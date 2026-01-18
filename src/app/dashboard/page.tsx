import Link from "next/link";
import DashboardClient from "./DashboardClient";

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

      <DashboardClient />

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">Schnellstart</h2>
        <p className="text-muted mt-2 text-sm">
          Starte direkt mit einem Beispielpool oder springe in die Hilfe, wenn du Details
          zu Steam Privacy brauchst.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="btn-animated rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30"
            href="/pools/sample"
          >
            Beispiel-Pool
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
