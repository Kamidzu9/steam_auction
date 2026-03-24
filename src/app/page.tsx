import Link from "next/link";
import { isAuthenticated } from "../lib/session";

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
    num: "1",
    title: "Steam verbinden",
    desc: "Logge dich mit deinem Steam-Konto ein.",
  },
  {
    num: "2",
    title: "Freund waehlen",
    desc: "Vergleiche eure Bibliotheken und finde gemeinsame Spiele.",
  },
  {
    num: "3",
    title: "Spiel losen",
    desc: "Lass den Auction Pool ein perfektes Co-op Game auswaehlen.",
  },
];

export default async function Home() {
  const loggedIn = await isAuthenticated();

  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute -top-32 right-[-120px] h-80 w-80 rounded-full bg-[color:var(--accent-2-soft)] blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-[color:var(--accent-soft)] blur-3xl" />

      <div className="flex flex-col gap-12">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6 pt-4">
          <span className="surface w-fit rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200/80">
            Steam Auction
          </span>
          <h1 className="font-display max-w-xl text-4xl font-semibold leading-tight text-white md:text-5xl">
            Findet heute Abend euer naechstes gemeinsames Spiel.
          </h1>
          <p className="max-w-lg text-lg text-muted">
            Verbindet eure Steam-Bibliotheken und lasst die Auktion das perfekte Co-op Spiel auswaehlen.
          </p>

          {loggedIn ? (
            <Link
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
              href="/dashboard"
            >
              <IconArrowRight className="h-4 w-4" />
              Weiter im Dashboard
            </Link>
          ) : (
            <a
              className="btn-animated inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
              href="/api/auth/steam"
            >
              <IconArrowRight className="h-4 w-4" />
              Mit Steam verbinden
            </a>
          )}
        </section>

        {/* Steps */}
        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="surface card-animated rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{step.num}</span>
              <h3 className="font-display mt-2 text-lg text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
