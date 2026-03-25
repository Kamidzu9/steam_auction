import Link from "next/link";
import { IconArrowRight } from "../components/Icons";

const steps = [
  {
    title: "1. Load games",
    desc: "Get your game list and compare it with friends.",
  },
  {
    title: "2. Build a pool",
    desc: "Add shared games to an auction pool.",
  },
  {
    title: "3. Random pick",
    desc: "Randomly choose a shared game for the evening.",
  },
];

const highlights = [
  {
    title: "Shared library",
    desc: "Instantly see which co-op games you both own.",
  },
  {
    title: "Weighted picks",
    desc: "New games get a boost, classics stay in the mix.",
  },
  {
    title: "Quick start",
    desc: "From login to game night in under a minute.",
  },
];

export default function Home() {
  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute -top-32 right-[-120px] h-80 w-80 rounded-full bg-[color:var(--accent-2-soft)] blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-[color:var(--accent-soft)] blur-3xl" />

      <div className="flex flex-col gap-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <span className="surface w-fit rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200/80">
              Steam Auction MVP
            </span>
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                Find a shared game in seconds.
              </h1>
              <p className="text-lg text-muted">
                Sign in with Steam, compare your libraries, and let the picker choose a co-op game.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/steam`}
              >
                <IconArrowRight className="h-4 w-4" />
                Connect with Steam
              </a>
              <Link
                className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:border-white/40 hover:scale-[1.02]"
                href="/dashboard"
              >
                <IconArrowRight className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span className="rounded-full border border-white/10 px-3 py-1">Co-op</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Live Pool</span>
              <span className="rounded-full border border-white/10 px-3 py-1">1 Click</span>
            </div>
          </div>

          <div className="surface-strong card-animated rounded-3xl p-6 lg:p-8 animate-pop">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tonight</p>
                <h2 className="font-display mt-2 text-2xl text-white">Live Auction Pool</h2>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Active
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {["Deep Rock Galactic", "Lethal Company", "Sea of Thieves"].map((game) => (
                <div
                  key={game}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <span>{game}</span>
                  <span className="text-xs text-slate-400">ready</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Friends</p>
                <p className="mt-2 font-display text-2xl text-white">4</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Games</p>
                <p className="mt-2 font-display text-2xl text-white">26</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="surface card-animated rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <h3 className="font-display text-lg text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface rounded-3xl p-6 lg:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Highlights</p>
            <h2 className="font-display mt-3 text-2xl text-white">More than just a random pick.</h2>
            <p className="mt-3 text-sm text-muted">
              Weighted selection and a clear overview help you start game night quickly.
            </p>
            <div className="mt-6 grid gap-4">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-display text-base text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-strong rounded-3xl p-6 lg:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Ready?</p>
            <h2 className="font-display mt-3 text-2xl text-white">
              Start your next session without scrolling through lists.
            </h2>
            <p className="mt-3 text-sm text-muted">
              Log in, pick your friends, and start the auction. Your next game is just minutes away.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/auth/steam`}
              >
                <IconArrowRight className="h-4 w-4" />
                Get Started
              </a>
              <Link
                className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40 hover:scale-[1.02]"
                href="/pools"
              >
                <IconArrowRight className="h-4 w-4" />
                View Pools
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
