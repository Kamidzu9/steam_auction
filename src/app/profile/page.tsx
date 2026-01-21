import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionById } from "@/lib/session";

export default async function ProfilePage(): Promise<JSX.Element> {
  const sid = cookies().get("sid")?.value ?? null;
  const session = sid ? await validateSessionById(sid) : null;

  if (!session) {
    redirect("/dashboard");
  }

  const user = (session as any).user ?? {};

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Profil</h1>
        <p className="text-muted mt-2 text-sm">Hier findest du deine Account-Details.</p>

        <div className="mt-4 flex items-center gap-4">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName ?? "Avatar"}
              width={96}
              height={96}
              className="rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-sm text-slate-300">
              Kein Avatar
            </div>
          )}

          <div>
            <div className="text-white font-semibold text-lg">{user.displayName ?? "Unbekannt"}</div>
            <div className="text-sm text-slate-300 mt-1">SteamID: {user.steamId}</div>
            <a href="/api/logout" className="mt-3 inline-block rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white hover:opacity-90">
              Logout
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
