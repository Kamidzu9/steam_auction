"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Step = {
  title: string;
  text: string;
  selector?: string;
};

const STEPS: Step[] = [
  {
    title: "Willkommen",
    text: "Diese kurze Tour zeigt dir die wichtigsten Schritte fuer den Pick.",
    selector: undefined,
  },
  {
    title: "Steam verbinden",
    text: "Melde dich mit Steam an, damit wir deine Bibliothek lesen koennen.",
    selector: "#btn-steam-login",
  },
  {
    title: "Eigene Spiele laden",
    text: "Lade deine Spieleliste, damit wir die Intersection berechnen koennen.",
    selector: "#btn-load-games",
  },
  {
    title: "Freunde laden",
    text: "Lade deine oeffentlichen Steam-Freunde oder fuege eine ID hinzu.",
    selector: "#btn-load-friends",
  },
  {
    title: "Freunde waehlen",
    text: "Waehle Freunde aus, die mit dir spielen sollen.",
    selector: "#friends-list",
  },
  {
    title: "Gemeinsame Spiele laden",
    text: "Berechne die gemeinsamen Spiele der Auswahl.",
    selector: "#btn-load-shared",
  },
  {
    title: "Pool erstellen",
    text: "Lege einen Pool an, damit die Picks gespeichert werden.",
    selector: "#btn-create-pool",
  },
  {
    title: "Pool befuellen",
    text: "Fuege die gemeinsamen Spiele dem Pool hinzu.",
    selector: "#btn-add-shared",
  },
  {
    title: "Pick starten",
    text: "Druecke auf den Button in der Mitte des Wheels.",
    selector: "#btn-pick-game",
  },
  {
    title: "Wheel",
    text: "Hier siehst du die Spiele im Pool und die Animation.",
    selector: "#wheel",
  },
];

function resolveIndexForward(startIndex: number) {
  if (typeof document === "undefined") {
    return Math.min(startIndex, STEPS.length - 1);
  }
  for (let i = Math.max(0, startIndex); i < STEPS.length; i += 1) {
    const selector = STEPS[i].selector;
    if (!selector) return i;
    const el = document.querySelector(selector);
    if (el) return i;
  }
  return STEPS.length - 1;
}

function resolveIndexBackward(startIndex: number) {
  if (typeof document === "undefined") {
    return Math.max(0, startIndex);
  }
  for (let i = Math.min(startIndex, STEPS.length - 1); i >= 0; i -= 1) {
    const selector = STEPS[i].selector;
    if (!selector) return i;
    const el = document.querySelector(selector);
    if (el) return i;
  }
  return 0;
}

function getInitialOpen() {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.startsWith("/dashboard")) return false;
  const saved = localStorage.getItem("steamAuction_showTutorial");
  const seen = localStorage.getItem("steamAuction_tutorial_seen");
  return saved !== "true" && seen !== "true";
}

function getInitialHideForever() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("steamAuction_showTutorial") === "true";
}

export default function Tutorial() {
  const pathname = usePathname();
  const isDashboard = useMemo(() => pathname?.startsWith("/dashboard") ?? false, [pathname]);
  const [open, setOpen] = useState(getInitialOpen);
  const [index, setIndex] = useState(0);
  const [hideForever, setHideForever] = useState(getInitialHideForever);
  const step = STEPS[index];

  const isVisible = isDashboard && open;

  useEffect(() => {
    if (!isVisible) return;
    try {
      localStorage.setItem("steamAuction_tutorial_seen", "true");
    } catch {
      // ignore
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !step?.selector) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    } catch {
      // ignore
    }
  }, [isVisible, step?.selector]);

  const targetRect = useMemo(() => {
    if (!isVisible || !step?.selector) return null;
    if (typeof document === "undefined") return null;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }, [isVisible, step]);

  function close(andHide = false) {
    setOpen(false);
    if (andHide) {
      try {
        localStorage.setItem("steamAuction_showTutorial", "true");
        setHideForever(true);
      } catch {
        // ignore
      }
    }
  }

  function next() {
    setIndex((i) => resolveIndexForward(i + 1));
  }

  function prev() {
    setIndex((i) => resolveIndexBackward(i - 1));
  }

  function openTutorial() {
    setIndex(resolveIndexForward(0));
    setOpen(true);
  }

  return (
    <div>
      {isDashboard ? (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-6 z-50 md:bottom-6">
          <button
            aria-label="Tutorial anzeigen"
            onClick={openTutorial}
            className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg hover:scale-105 transition-transform"
          >
            Tutorial
          </button>
        </div>
      ) : null}

      {isVisible ? (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={() => close(false)} />

          {targetRect ? (
            <>
              <div
                style={{
                  position: "absolute",
                  top: targetRect.top - 6,
                  left: targetRect.left - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                  borderRadius: 8,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                  border: "2px solid var(--accent)",
                  transition: "all 250ms ease",
                  pointerEvents: "none",
                  zIndex: 60,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top:
                    targetRect.top > window.innerHeight * 0.6
                      ? Math.max(12, targetRect.top - 190)
                      : Math.max(12, targetRect.top + targetRect.height + 10),
                  left: Math.min(
                    Math.max(12, targetRect.left),
                    Math.max(12, window.innerWidth - 320)
                  ),
                  zIndex: 70,
                }}
              >
                <div className="w-80 max-w-[90vw] rounded-2xl bg-slate-900/95 p-4 text-slate-100 shadow-2xl pointer-events-auto">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{step.title}</div>
                      <div className="mt-1 text-xs text-slate-300">{step.text}</div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <button onClick={() => close(false)} className="text-xs text-slate-400 hover:text-white">
                        Schliessen
                      </button>
                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={hideForever}
                          onChange={(e) => {
                            const v = e.target.checked;
                            setHideForever(v);
                            try {
                              if (v) localStorage.setItem("steamAuction_showTutorial", "true");
                              else localStorage.removeItem("steamAuction_showTutorial");
                            } catch {
                              // ignore
                            }
                          }}
                        />
                        Nicht mehr anzeigen
                      </label>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-400">Schritt {index + 1} / {STEPS.length}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={prev}
                        disabled={index === 0}
                        className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-200 disabled:opacity-50"
                      >
                        Zurueck
                      </button>
                      {index < STEPS.length - 1 ? (
                        <button
                          onClick={next}
                          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                        >
                          Weiter
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (hideForever) close(true);
                            else close(false);
                          }}
                          className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900"
                        >
                          Fertig
                        </button>
                      )}
                      <button
                        onClick={() => close(true)}
                        className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200"
                      >
                        Ueberspringen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="relative z-70 max-w-xl rounded-2xl bg-slate-900/95 p-6 text-slate-100 shadow-2xl">
                <div className="text-lg font-semibold">{step.title}</div>
                <div className="mt-2 text-sm text-slate-300">{step.text}</div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={prev}
                    disabled={index === 0}
                    className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-200 disabled:opacity-50"
                  >
                    Zurueck
                  </button>
                  {index < STEPS.length - 1 ? (
                    <button onClick={next} className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-900">
                      Weiter
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (hideForever) close(true);
                        else close(false);
                      }}
                      className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900"
                    >
                      Fertig
                    </button>
                  )}
                  <button
                    onClick={() => close(true)}
                    className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200"
                  >
                    Ueberspringen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
