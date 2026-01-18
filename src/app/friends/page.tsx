import Link from "next/link";

export default function FriendsPage() {
  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Friends</h1>
        <p className="text-muted mt-2 text-sm">
          Freunde verwaltest du im Dashboard. Dort kannst du Steam-Freunde laden,
          filtern und auswaehlen.
        </p>
        <Link
          href="/dashboard"
          className="btn-animated mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
        >
          Zum Dashboard
        </Link>
      </section>
    </div>
  );
}
