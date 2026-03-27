"use client";

import { useState } from "react";
import { useApi } from "../lib/ApiProvider";

export default function SystemSetup() {
  const { client, refreshSystemStatus } = useApi();
  const [apiKey, setApiKey] = useState("");
  const [realm, setRealm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("Steam API Key is required.");
      return;
    }

    setLoading(true);
    try {
      await client.configureSystem({ apiKey: apiKey.trim(), realm: realm.trim() || undefined });
      await refreshSystemStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to configure system.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="surface-strong animate-fade-in w-full max-w-lg rounded-3xl p-8 md:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-amber-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M12 2L2 7l10 5 10-5-10-5Z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">
            Initial Setup
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            To use Steam Auction, you need to provide your own Steam Web API key. This key is stored locally on your device and is never sent to any central server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="apiKey" className="mb-2 block text-sm font-medium text-white">
              Steam Web API Key <span className="text-rose-400">*</span>
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-amber-400 focus:bg-white/10"
              placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              required
            />
            <p className="mt-2 text-xs text-muted">
              Get your free key from the{" "}
              <a
                href="https://steamcommunity.com/dev/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline"
              >
                Steam Developer Portal
              </a>.
            </p>
          </div>

          <div>
            <label htmlFor="realm" className="mb-2 block text-sm font-medium text-white">
              Domain Name (Optional)
            </label>
            <input
              id="realm"
              type="text"
              value={realm}
              onChange={(e) => setRealm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-amber-400 focus:bg-white/10"
              placeholder="http://localhost:3000"
            />
            <p className="mt-2 text-xs text-muted">
              Only needed if you are hosting this on a public domain for Steam login callbacks.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-animated mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-amber-500 px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>
      </div>
    </div>
  );
}
