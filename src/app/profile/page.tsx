import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionById } from "@/lib/session";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value ?? null;
  const session = sid ? await validateSessionById(sid) : null;

  if (!session) {
    redirect("/dashboard");
  }

  const user = (session as any).user ?? {};

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
