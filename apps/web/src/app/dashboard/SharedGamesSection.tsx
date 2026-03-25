type GameItem = {
  appid: number;
  name: string;
  playtime_forever?: number;
};

type SharedGamesSectionProps = {
  intersectionCount: number;
  previewGames: GameItem[];
  onToggleTagPreset: (tags: string[]) => void;
};

export default function SharedGamesSection({
  intersectionCount,
  previewGames,
  onToggleTagPreset,
}: SharedGamesSectionProps) {
  return (
    <section className="surface rounded-2xl p-6 card-animated animate-pop">
      <h2 className="font-display text-lg text-white">Shared Games</h2>
      <p className="text-muted mt-2 text-sm">
        Games in common: {intersectionCount}
      </p>
      <div className="mt-3">
        <label className="text-sm text-slate-300">Filter by tags:</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className="btn-animated rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200 hover:border-emerald-300"
            onClick={() =>
              onToggleTagPreset(["coop", "online co-op", "local co-op"])
            }
            type="button"
          >
            Co-op
          </button>
          <button
            className="btn-animated rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-white/40"
            onClick={() => onToggleTagPreset(["multiplayer"])}
            type="button"
          >
            Multiplayer
          </button>
        </div>
      </div>

      {previewGames.length > 0 ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {previewGames.map((game) => (
            <div
              key={game.appid}
              className="flex min-w-0 items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200"
            >
              <span className="min-w-0 flex-1 truncate">{game.name}</span>
              <span className="ml-3 flex-shrink-0 text-xs text-slate-400">
                #{game.appid}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted mt-4 text-sm">
          No matching games found. Check your selection or reload.
        </p>
      )}
    </section>
  );
}
