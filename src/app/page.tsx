export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 animate-fade-in">
        <section className="flex flex-col gap-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Steam Auction MVP
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Find a co-op game fast.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Sign in with Steam, compare your library with friends, and spin the
            auction pool for a random pick.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 btn-animated hover:scale-105"
              href="/api/auth/steam"
            >
              Anmelden mit Steam
            </a>
            <a
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 btn-animated hover:scale-105"
              href="/dashboard"
            >
              Dashboard
            </a>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "1. Spiele abrufen",
              desc: "Hol dir deine Spieleliste und vergleiche sie mit Freunden.",
            },
            {
              title: "2. Pool bauen",
              desc: "Füge gemeinsame Spiele in einen Auction Pool hinzu.",
            },
            {
              title: "3. Zufallspick",
              desc: "Wähle per Zufall ein gemeinsames Spiel für den Abend.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 card-animated animate-pop"
            >
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
