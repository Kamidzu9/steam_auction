export default function HelpPage() {
  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Help & Guide</h1>
        <p className="text-muted mt-2 text-sm">
          Quickest way: Connect Steam, select friends, create a pool, start a pick.
        </p>
      </section>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">Step by step</h2>
        <ol className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <li>1. Connect Steam and load your games.</li>
          <li>2. Load Steam friends or add IDs manually.</li>
          <li>3. Select friends and find shared games.</li>
          <li>4. Create a pool and add shared games.</li>
          <li>5. Start a pick and enjoy the result.</li>
        </ol>
      </section>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-lg text-white">FAQ</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <div>
            <p className="font-semibold text-white">Why can&apos;t I see any games?</p>
            <p className="text-muted">
              Your Steam profile must be public. Check your privacy settings.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Why are friends missing?</p>
            <p className="text-muted">
              The friends list is only available when it is set to public.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">What does Avoid mean?</p>
            <p className="text-muted">
              Recent picks are excluded so there are no repeats.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
