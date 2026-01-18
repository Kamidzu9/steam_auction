import Link from "next/link";

type IconProps = { className?: string };

function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

const steps = [
  {
    title: "1. Spiele abrufen",
    desc: "Hol dir deine Spieleliste und vergleiche sie mit Freunden.",
  },
  {
    title: "2. Pool bauen",
    desc: "Fuege gemeinsame Spiele in einen Auction Pool hinzu.",
  },
  {
    title: "3. Zufallspick",
    desc: "Waehle per Zufall ein gemeinsames Spiel fuer den Abend.",
  },
];

const highlights = [
  {
    title: "Gemeinsame Bibliothek",
    desc: "Sieh sofort, welche Co-op Titel euch beiden gehoeren.",
  },
  {
    title: "Gewichtetes Losen",
    desc: "Neue Games bekommen einen Boost, Klassiker bleiben fair dabei.",
  },
  {
    title: "Schneller Start",
    desc: "In unter einer Minute vom Login zum naechsten Abendspiel.",
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
                Finde in Sekunden ein gemeinsames Spiel fuer heute Abend.
              </h1>
              <p className="text-lg text-muted">
                Melde dich mit Steam an, vergleiche eure Bibliotheken und lasse den
                Auction Pool ein Co-op Game auswaehlen, das wirklich passt.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
                href="/api/auth/steam"
              >
                <IconArrowRight className="h-4 w-4" />
                Mit Steam verbinden
              </a>
              <Link
                className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:border-white/40 hover:scale-[1.02]"
                href="/dashboard"
              >
                <IconArrowRight className="h-4 w-4" />
                Zum Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span className="rounded-full border border-white/10 px-3 py-1">Co-op</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Live Pool</span>
              <span className="rounded-full border border-white/10 px-3 py-1">1 Klick</span>
            </div>
          </div>

          <div className="surface-strong card-animated rounded-3xl p-6 lg:p-8 animate-pop">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Heute Abend</p>
                <h2 className="font-display mt-2 text-2xl text-white">Live Auction Pool</h2>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Aktiv
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {["Deep Rock Galactic", "Lethal Company", "Sea of Thieves"].map((game) => (
                <div
                  key={game}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <span>{game}</span>
                  <span className="text-xs text-slate-400">bereit</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Freunde</p>
                <p className="mt-2 font-display text-2xl text-white">4</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Spiele</p>
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
            <h2 className="font-display mt-3 text-2xl text-white">Mehr als nur ein Zufallspick.</h2>
            <p className="mt-3 text-sm text-muted">
              Gewichtete Auswahl, Pool-Profile und eine klare Uebersicht helfen euch,
              den Abend schnell zu starten.
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
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Bereit?</p>
            <h2 className="font-display mt-3 text-2xl text-white">
              Starte die naechste Session ohne lange Listen.
            </h2>
            <p className="mt-3 text-sm text-muted">
              Logge dich ein, waehle deine Freunde und starte die Auktion. In wenigen
              Minuten steht euer naechstes Spiel fest.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:scale-[1.02]"
                href="/api/auth/steam"
              >
                <IconArrowRight className="h-4 w-4" />
                Jetzt loslegen
              </a>
              <Link
                className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40 hover:scale-[1.02]"
                href="/pools"
              >
                <IconArrowRight className="h-4 w-4" />
                Pools ansehen
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
