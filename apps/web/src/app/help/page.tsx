export default function HelpPage() {
  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Hilfe & Anleitung</h1>
        <p className="text-muted mt-2 text-sm">
          Der schnellste Weg: Steam verbinden, Freunde waehlen, Pool erstellen, Pick starten.
        </p>
      </section>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">Schritt-fuer-Schritt</h2>
        <ol className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <li>1. Steam verbinden und eigene Spiele laden.</li>
          <li>2. Steam-Freunde laden oder IDs hinzufuegen.</li>
          <li>3. Freunde waehlen und gemeinsame Spiele berechnen.</li>
          <li>4. Pool erstellen und gemeinsame Spiele hinzufuegen.</li>
          <li>5. Pick starten und das Ergebnis feiern.</li>
        </ol>
      </section>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">FAQ</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <div>
            <p className="font-semibold text-white">Warum sehe ich keine Spiele?</p>
            <p className="text-muted">
              Dein Steam-Profil muss oeffentlich sein. Pruefe die Privacy-Einstellungen.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Warum fehlen Freunde?</p>
            <p className="text-muted">
              Die Freundesliste ist nur verfuegbar, wenn sie oeffentlich ist.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Was bedeutet Avoid?</p>
            <p className="text-muted">
              Die letzten Picks werden ausgeschlossen, damit keine Wiederholungen entstehen.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
