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
    </div>
  );
}
