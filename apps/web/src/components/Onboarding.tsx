"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useApi } from "../lib/ApiProvider";
import { completeOnboarding } from "../lib/onboarding";

interface UserProfile {
  displayName: string | null;
  avatarUrl: string | null;
}

const STEP_COUNT = 3;

export default function Onboarding() {
  const { client, accessToken, isLoading } = useApi();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const goTo = useCallback((next: number) => {
    setFadeKey((k) => k + 1);
    setStep(next);
  }, []);

  // When user arrives at step 2 already authenticated, auto-advance to step 2
  useEffect(() => {
    if (!isLoading && accessToken && step === 1) {
      goTo(2);
    }
  }, [isLoading, accessToken, step, goTo]);

  // Fetch profile when reaching step 2 with an access token
  useEffect(() => {
    if (step === 2 && accessToken && !profile && !profileLoading && !profileError) {
      setProfileLoading(true);
      client
        .getMe()
        .then((data: { user: UserProfile }) => setProfile(data.user))
        .catch(() => setProfileError(true))
        .finally(() => setProfileLoading(false));
    }
  }, [step, accessToken, profile, profileLoading, profileError, client]);

  const handleFinish = () => {
    completeOnboarding();
    window.location.href = accessToken ? "/dashboard" : "/";
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-3" aria-label="Setup progress">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "w-8 bg-amber-400"
                : i < step
                  ? "w-2 bg-amber-400/50"
                  : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div
        key={fadeKey}
        className="surface-strong animate-fade-in w-full max-w-lg rounded-3xl p-8 md:p-10"
      >
        {step === 0 && <StepWelcome onNext={() => goTo(1)} />}
        {step === 1 && (
          <StepConnect
            steamLoginUrl={client.steamLoginUrl}
            onSkip={() => {
              setSkipped(true);
              goTo(2);
            }}
            onBack={() => goTo(0)}
          />
        )}
        {step === 2 && (
          <StepReady
            accessToken={accessToken}
            profile={profile}
            profileLoading={profileLoading}
            profileError={profileError}
            skipped={skipped}
            onFinish={handleFinish}
            onBack={() => goTo(1)}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Welcome                                                    */
/* ------------------------------------------------------------------ */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
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
        Welcome to Steam Auction
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Find games you and your friends all own, then let the picker randomly
        choose what to play tonight. No more scrolling through lists.
      </p>

      <button
        onClick={onNext}
        className="btn-animated mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
      >
        Get Started
        <ArrowRight />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Connect Steam                                              */
/* ------------------------------------------------------------------ */
function StepConnect({
  steamLoginUrl,
  onSkip,
  onBack,
}: {
  steamLoginUrl: string;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-400/10">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-teal-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </div>

      <h2 className="font-display text-2xl font-semibold text-white">
        Connect your Steam account
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        We use Steam&apos;s official sign-in so we can see your game library.
        We never see your password.
      </p>

      <a
        href={steamLoginUrl}
        className="btn-animated mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
      >
        Connect with Steam
        <ArrowRight />
      </a>

      <button
        onClick={onSkip}
        className="mt-4 text-sm text-muted underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
      >
        Skip for now
      </button>

      <div className="mt-8 flex w-full justify-start">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-white"
        >
          <ArrowLeft />
          Back
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Ready                                                      */
/* ------------------------------------------------------------------ */
function StepReady({
  accessToken,
  profile,
  profileLoading,
  profileError,
  skipped,
  onFinish,
  onBack,
}: {
  accessToken: string | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: boolean;
  skipped: boolean;
  onFinish: () => void;
  onBack: () => void;
}) {
  const connected = !!accessToken && !skipped;

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon */}
      <div
        className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
          connected ? "bg-emerald-400/10" : "bg-white/5"
        }`}
      >
        {connected ? (
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        )}
      </div>

      <h2 className="font-display text-2xl font-semibold text-white">
        {connected ? "You\u2019re all set!" : "You\u2019re good to go"}
      </h2>

      {/* Profile card */}
      {connected && profileLoading && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      )}

      {connected && profile && (
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          {profile.avatarUrl && (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName ?? "Steam user"}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
              unoptimized
            />
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              {profile.displayName ?? "Steam User"}
            </p>
            <p className="text-xs text-muted">Steam connected</p>
          </div>
        </div>
      )}

      {connected && profileError && !profile && (
        <p className="mt-4 text-sm text-amber-300">
          Couldn&apos;t load your profile, but your account is connected. You
          can continue.
        </p>
      )}

      {!connected && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          No worries — you can connect your Steam account anytime from the
          dashboard.
        </p>
      )}

      <button
        onClick={onFinish}
        className="btn-animated mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
      >
        {connected ? "Go to Dashboard" : "Explore the App"}
        <ArrowRight />
      </button>

      <div className="mt-8 flex w-full justify-start">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-white"
        >
          <ArrowLeft />
          Back
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny arrow icons (self-contained to avoid extra imports)           */
/* ------------------------------------------------------------------ */
function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}
