import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 animate-fade-in">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Steam login required to fetch games and friends.
          </p>
        </header>

        <DashboardClient />

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 card-animated animate-pop">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              className="rounded-full border border-slate-700 px-4 py-2 hover:border-slate-500"
              href="/pools/sample"
            >
              View Sample Pool
            </Link>
            <a
              className="rounded-full bg-white px-4 py-2 text-slate-900"
              href="/api/auth/steam"
            >
              Steam Login
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
