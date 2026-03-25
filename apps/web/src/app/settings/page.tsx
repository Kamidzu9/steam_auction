"use client";

import { useRouter } from "next/navigation";
import { useApi } from "../../lib/ApiProvider";
import { resetOnboarding } from "../../lib/onboarding";

export default function SettingsPage() {
  const { client, accessToken, isLoading, setAccessToken } = useApi();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await client.logout();
    } catch {
      // best-effort logout
    }
    setAccessToken(null);
    router.push("/");
  };

  const handleRerunSetup = () => {
    resetOnboarding();
    router.push("/setup");
  };

  return (
    <main className="animate-fade-in mx-auto max-w-lg space-y-6 px-4 pt-8 pb-28">
      <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>

      {/* Account */}
      <section className="surface space-y-4 rounded-2xl p-5">
        <h2 className="font-display text-lg font-semibold">Account</h2>

        {isLoading ? (
          <p className="text-muted text-sm">Checking connection…</p>
        ) : accessToken ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Connected
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-2 text-sm">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/20" />
              Not connected
            </span>
            <a
              href={client.steamLoginUrl}
              className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
            >
              Connect Steam
            </a>
          </div>
        )}
      </section>

      {/* Setup */}
      <section className="surface space-y-4 rounded-2xl p-5">
        <h2 className="font-display text-lg font-semibold">Setup</h2>
        <p className="text-muted text-sm">Walk through the initial setup again.</p>
        <button
          onClick={handleRerunSetup}
          className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
        >
          Re-run Setup
        </button>
      </section>

      {/* About */}
      <section className="surface space-y-2 rounded-2xl p-5">
        <h2 className="font-display text-lg font-semibold">About</h2>
        <p className="text-sm">
          <span className="font-medium">Steam Auction</span>{" "}
          <span className="text-muted">v26.0</span>
        </p>
        <p className="text-muted text-sm">
          Discover, pool, and auction your Steam inventory with friends.
        </p>
      </section>
    </main>
  );
}
