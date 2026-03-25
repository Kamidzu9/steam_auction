import Link from "next/link";
import Image from "next/image";
import { IconLink, IconRefresh, IconStack } from "../../components/Icons";

type User = {
  id: string;
  steamId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type StatusSectionProps = {
  user: User | null;
  authReady: boolean;
  isLoggedIn: boolean;
  canUseSteam: boolean;
  loginFailed: boolean;
  isLoggingOut: boolean;
  myGamesCount: number;
  friendGamesCount: number;
  intersectionCount: number;
  status: string;
  error: string;
  steamLoginUrl: string;
  onLogout: () => void;
  onLoadGames: () => void;
};

export default function StatusSection({
  user,
  authReady,
  isLoggedIn,
  canUseSteam,
  loginFailed,
  isLoggingOut,
  myGamesCount,
  friendGamesCount,
  intersectionCount,
  status,
  error,
  steamLoginUrl,
  onLogout,
  onLoadGames,
}: StatusSectionProps) {
  return (
    <section className="surface rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName ?? "Steam avatar"}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">
              Steam
            </div>
          )}
          <div>
            <h2 className="font-display text-lg text-white">
              Status
            </h2>
            <p className="text-muted mt-1 text-sm">
              {!authReady
                ? "Loading session..."
                : isLoggedIn
                  ? `Logged in as ${user?.displayName ?? user?.steamId}`
                  : "Not logged in. Connect Steam to load games."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!authReady ? (
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Loading session...
            </span>
          ) : !isLoggedIn ? (
            <a
              id="btn-steam-login"
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
              href={steamLoginUrl}
            >
              <IconLink className="h-4 w-4" />
              Connect with Steam
            </a>
          ) : (
            <>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                Connected
              </span>
              <button
                className="btn-animated rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onLogout}
                disabled={isLoggingOut}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {loginFailed ? (
        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          Steam login failed. Please try again or check your Steam session.
        </div>
      ) : null}

      {status ? (
        <p className="mt-3 text-sm text-slate-200 animate-slide-up">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-rose-200 animate-slide-up">{error}</p>
      ) : null}
      <div className="mt-4 grid gap-2 text-sm text-slate-400 md:grid-cols-3 animate-slide-up">
        <span>My Games: {myGamesCount}</span>
        <span>Friend Games: {friendGamesCount}</span>
        <span>Shared: {intersectionCount}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          id="btn-load-games"
          className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onLoadGames}
          disabled={!canUseSteam}
        >
          <IconRefresh className="h-4 w-4" />
          Load My Games
        </button>
        {canUseSteam ? (
          <Link
            className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
            href="/pools"
          >
            <IconStack className="h-4 w-4" />
            View Pools
          </Link>
        ) : (
          <span className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400 opacity-60">
            <IconStack className="h-4 w-4" />
            View Pools
          </span>
        )}
      </div>
    </section>
  );
}
