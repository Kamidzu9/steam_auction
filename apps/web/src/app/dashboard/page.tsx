import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="surface rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-white/10 rounded mb-3" />
        <div className="h-4 w-full bg-white/10 rounded mb-2" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
      </div>
      <div className="surface rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-32 bg-white/10 rounded mb-3" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-white md:text-3xl">
          Dashboard
        </h1>
        <p className="text-muted mt-1 text-sm">
          Find shared games and pick what to play.
        </p>
      </header>

      <Suspense fallback={<DashboardFallback />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
