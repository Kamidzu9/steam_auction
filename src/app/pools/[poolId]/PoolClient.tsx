"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import AuctionWheel, { AuctionWheelHandle } from "@/components/AuctionWheel";

type PoolGame = {
  appId: number;
  name: string;
  storeUrl?: string | null;
  weight?: number;
};

type ApiErrorResponse = { error?: string };

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Request failed";
}

async function safeFetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorResponse;
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Request failed";
    throw new Error(message);
  }
  return data as T & ApiErrorResponse;
}

export default function PoolClient({ poolId, games }: { poolId: string; games: PoolGame[] }) {
  const wheelRef = useRef<AuctionWheelHandle | null>(null);
  const [pickMode, setPickMode] = useState<"pure" | "avoid">("pure");
  const [avoidCount, setAvoidCount] = useState(3);
  const [spinSeconds, setSpinSeconds] = useState(4.2);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [pickResult, setPickResult] = useState<string>("");
  const [pickImage, setPickImage] = useState<string | null>(null);
  const [pickPulse, setPickPulse] = useState(false);

  async function pickGame() {
    setStatus("Spiel wird ausgewaehlt...");
    setError("");
    try {
      const data = await safeFetchJson<{ pick?: { name: string; appId?: number }; error?: string }>(
        `/api/pools/${poolId}/pick`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: pickMode, avoidCount }),
        }
      );
      if (data.error) {
        setError(data.error);
        setStatus("");
        return;
      }
      const pickedName = data.pick?.name;
      const pickedAppId = data.pick?.appId;
      if (pickedName) {
        setStatus("Wheel dreht...");
        if (pickedAppId && wheelRef.current) {
          try {
            const durationMs = Math.max(200, Math.round(spinSeconds * 1000));
            await wheelRef.current.spinTo(pickedAppId, durationMs);
          } catch {
            // ignore
          }
        }
        setPickResult(pickedName);
        const picked = games.find((g) => g.appId === pickedAppId);
        setPickImage(picked ? `https://cdn.akamai.steamstatic.com/steam/apps/${picked.appId}/header.jpg` : null);
        setPickPulse(true);
        setTimeout(() => setPickPulse(false), 1200);
      } else {
        setPickResult("Kein Pick verfuegbar.");
      }
      setStatus("");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Modus:</label>
            <select
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={pickMode}
              onChange={(e) => setPickMode(e.target.value as "pure" | "avoid")}
            >
              <option value="pure">Zufall (pure)</option>
              <option value="avoid">Avoid repeats</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Avoid:</label>
            <input
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
              type="number"
              min={1}
              value={avoidCount}
              onChange={(e) => setAvoidCount(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Spin (s):</label>
            <input
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
              type="number"
              step={0.1}
              min={0.5}
              value={spinSeconds}
              onChange={(e) => setSpinSeconds(Number(e.target.value))}
            />
          </div>
        </div>

        <div id="wheel" className="mt-6 flex items-center justify-center">
          <AuctionWheel
            ref={wheelRef}
            items={games.map((g) => ({ appid: g.appId, name: g.name }))}
            onCenterClick={() => void pickGame()}
          />
        </div>

        {status ? <p className="mt-3 text-sm text-slate-200">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

        {pickResult ? (
          <div
            className={`mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 transition ${
              pickPulse ? "animate-reveal-pick animate-pulse-once" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {pickImage ? (
                <Image
                  src={pickImage}
                  alt={pickResult}
                  width={460}
                  height={215}
                  className="h-16 w-28 rounded-md object-cover shadow-md"
                  sizes="(max-width: 768px) 112px, 112px"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (!t.src.includes("header.jpg")) {
                      t.src = "https://cdn.akamai.steamstatic.com/steam/apps/0/header.jpg";
                    }
                  }}
                />
              ) : null}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Ergebnis</div>
                <div className="text-lg font-semibold">{pickResult}</div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
