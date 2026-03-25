import Link from "next/link";
import Image from "next/image";
import { type RefObject } from "react";
import AuctionWheel, { AuctionWheelHandle } from "../../components/AuctionWheel";
import { IconStack, IconPlus, IconArrowRight } from "../../components/Icons";

type GameItem = {
  appid: number;
  name: string;
  playtime_forever?: number;
};

type Pool = {
  id: string;
  name: string;
};

type WheelItem = { appid: number; name: string };
type SpinState = "idle" | "preparing" | "spinning" | "result";

type PickerSectionProps = {
  pool: Pool | null;
  poolSeeded: boolean;
  pickMode: "pure" | "avoid";
  avoidCount: number;
  spinSeconds: number;
  spinState: SpinState;
  pickResult: string;
  pickImage: string | null;
  pickPulse: boolean;
  wheelItems: GameItem[];
  spinningItem: WheelItem | null;
  canUseSteam: boolean;
  canCreatePool: boolean;
  canAddToPool: boolean;
  canPick: boolean;
  isSpinBusy: boolean;
  pickDisabledReason: string | undefined;
  wheelRef: RefObject<AuctionWheelHandle | null>;
  onSetPickMode: (mode: "pure" | "avoid") => void;
  onSetAvoidCount: (updater: (prev: number) => number) => void;
  onSetSpinSeconds: (updater: (prev: number) => number) => void;
  onSetActiveWheelItem: (item: WheelItem | null) => void;
  onCreatePool: () => void;
  onAddToPool: () => void;
  onPickGame: () => void;
};

export default function PickerSection({
  pool,
  poolSeeded,
  pickMode,
  avoidCount,
  spinSeconds,
  spinState,
  pickResult,
  pickImage,
  pickPulse,
  wheelItems,
  spinningItem,
  canUseSteam,
  canCreatePool,
  canAddToPool,
  canPick,
  isSpinBusy,
  pickDisabledReason,
  wheelRef,
  onSetPickMode,
  onSetAvoidCount,
  onSetSpinSeconds,
  onSetActiveWheelItem,
  onCreatePool,
  onAddToPool,
  onPickGame,
}: PickerSectionProps) {
  return (
    <section className="surface rounded-2xl p-6 card-animated animate-pop">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-white">Pool & Pick</h2>
          <p className="text-muted mt-2 text-sm">
            Create a pool, add shared games, and let the picker decide.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            id="btn-create-pool"
            className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCreatePool}
            disabled={!canCreatePool}
          >
            <IconStack className="h-4 w-4" />
            Create Pool
          </button>
          <button
            id="btn-add-shared"
            className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onAddToPool}
            disabled={!canAddToPool}
          >
            <IconPlus className="h-4 w-4" />
            Add Games
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Mode:</label>
          <select
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            value={pickMode}
            onChange={(e) => onSetPickMode(e.target.value as "pure" | "avoid")}
            disabled={!canUseSteam || isSpinBusy}
          >
            <option value="pure">Random</option>
            <option value="avoid">Avoid repeats</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Avoid:</label>
          <input
            className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="number"
            min={1}
            step={1}
            value={avoidCount}
            onChange={(e) => {
              const next = Number(e.target.value);
              onSetAvoidCount((prev) =>
                Number.isFinite(next) ? Math.max(1, Math.round(next)) : prev,
              );
            }}
            disabled={pickMode !== "avoid" || !canUseSteam || isSpinBusy}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Spin (s):</label>
          <input
            className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="number"
            step={0.1}
            min={1}
            value={spinSeconds}
            onChange={(e) => {
              const next = Number(e.target.value);
              onSetSpinSeconds((prev) => {
                if (!Number.isFinite(next)) return prev;
                return Math.min(12, Math.max(1, next));
              });
            }}
            disabled={!canUseSteam || isSpinBusy}
          />
        </div>
      </div>

      <div
        id="wheel"
        className={`mt-6 flex items-center justify-center ${spinState === "preparing" ? "animate-pulse" : ""}`}
      >
        <AuctionWheel
          ref={wheelRef}
          items={wheelItems.map((g) => ({ appid: g.appid, name: g.name }))}
          onCenterClick={onPickGame}
          disabled={!canPick}
          disabledReason={pickDisabledReason}
          allowDrag={false}
          onActiveItemChange={(item) =>
            onSetActiveWheelItem(
              item ? { appid: item.appid, name: item.name } : null,
            )
          }
        />
      </div>

      {isSpinBusy || pickResult ? (
        <div
          className={`mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 transition ${
            pickPulse ? "animate-reveal-pick animate-pulse-once" : ""
          }`}
        >
          {isSpinBusy ? (
            spinningItem ? (
              <div className="flex items-center gap-3">
                <Image
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${spinningItem.appid}/header.jpg`}
                  alt={spinningItem.name}
                  width={460}
                  height={215}
                  unoptimized
                  className="h-16 w-28 rounded-md object-cover shadow-md"
                  sizes="(max-width: 768px) 112px, 112px"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (!t.src.includes("/icons/icon-192.svg")) {
                      t.src = "/icons/icon-192.svg";
                    }
                  }}
                />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Result
                  </div>
                  <div className="text-lg font-semibold leading-tight break-words">
                    {spinningItem.name}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300">Wheel spinning...</div>
            )
          ) : (
            <div className="flex items-center gap-3">
              {pickImage ? (
                <Image
                  src={pickImage}
                  alt={pickResult}
                  width={460}
                  height={215}
                  unoptimized
                  className="h-16 w-28 rounded-md object-cover shadow-md"
                  sizes="(max-width: 768px) 112px, 112px"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (!t.src.includes("/icons/icon-192.svg")) {
                      t.src = "/icons/icon-192.svg";
                    }
                  }}
                />
              ) : null}
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Result
                </div>
                <div className="text-lg font-semibold leading-tight break-words">
                  {pickResult}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {pool?.id ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>
            Pool ID: {pool.id} {poolSeeded ? "(seeded)" : ""}
          </span>
          <Link
            className="inline-flex items-center gap-1 text-amber-200 hover:text-amber-100"
            href={`/pools?poolId=${encodeURIComponent(pool.id)}`}
          >
            <IconArrowRight className="h-4 w-4" />
            Open Pool
          </Link>
        </div>
      ) : null}
      <p className="text-muted mt-3 text-xs">
        Avoid mode excludes recent picks. Spin duration controls the animation.
      </p>
    </section>
  );
}
