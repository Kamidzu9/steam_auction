import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

function DashboardFallback() {
  return (
    <div className="space-y-4">
      <div className="surface rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-white/10 rounded mb-3"></div>
        <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-white/10 rounded mb-5"></div>
        <div className="h-10 w-40 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
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
