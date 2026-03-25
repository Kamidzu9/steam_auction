"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "../components/Icons";
import { isOnboardingComplete } from "../lib/onboarding";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace("/setup");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="pointer-events-none absolute -top-32 right-[-120px] h-80 w-80 rounded-full bg-[color:var(--accent-2-soft)] blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-[color:var(--accent-soft)] blur-3xl" />

      <div className="animate-fade-in flex flex-col items-center gap-6">
        <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
          Steam Auction
        </h1>

        <p className="max-w-md text-lg text-muted">
          Compare libraries with friends and randomly pick a co-op game for tonight.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Link
            className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
            href="/dashboard"
          >
            <IconArrowRight className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <Link
            className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:border-white/40 hover:scale-[1.02]"
            href="/pools"
          >
            <IconArrowRight className="h-4 w-4" />
            View Pools
          </Link>
        </div>
      </div>
    </div>
  );
}
