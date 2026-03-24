import Image from "next/image";
import { cookies } from "next/headers";
import { validateSessionById } from "@/lib/session";

type SessionUser = {
  id: string;
  steamId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export default async function ProfilePage() {
  let user: SessionUser | null = null;

  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get("sid")?.value ?? null;
    const session = sid ? await validateSessionById(sid) : null;
    user = session ? (session.user as SessionUser) : null;
  } catch {
    // DB not available — show not-logged-in state
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <section className="surface rounded-2xl p-6">
          <h1 className="font-display text-2xl text-white">Profil</h1>
          <p className="text-muted mt-2 text-sm">
            Bitte mit Steam anmelden, um dein Profil zu sehen.
          </p>
          <a
            href="/api/auth/steam"
            className="btn-animated mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
          >
            Mit Steam anmelden
          </a>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="surface rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName ?? "Avatar"}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-sm text-slate-300">
              ?
            </div>
          )}

          <div>
            <div className="text-white font-semibold text-lg">{user.displayName ?? "Unbekannt"}</div>
            <div className="text-xs text-slate-400 mt-1">SteamID: {user.steamId}</div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <a
            href="/api/logout"
            className="btn-animated inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
          >
            Logout
          </a>
        </div>
      </section>
    </div>
  );
}
