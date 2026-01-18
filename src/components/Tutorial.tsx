"use client";

import { useEffect, useState } from "react";

type Step = {
  title: string;
  text: string;
  selector?: string;
};

const STEPS: Step[] = [
  { title: "Welcome", text: "This short guide will point to the buttons you should press.", selector: undefined },
  { title: "Load Friends", text: "Click here to load your public Steam friends.", selector: "#btn-load-friends" },
  { title: "Choose Friends", text: "Pick specific friends to include in the shared pool.", selector: "#friends-list" },
  { title: "Load Shared Games", text: "Load the intersection of selected friends' libraries with yours.", selector: "#btn-load-shared" },
  { title: "Create Pool", text: "Create a shared pool to persist choices.", selector: "#btn-create-pool" },
  { title: "Seed Pool", text: "Add the shared games into the pool for future picks.", selector: "#btn-add-shared" },
  { title: "Pick a Game", text: "Finally, spin the wheel to pick a game.", selector: "#btn-pick-game" },
  { title: "Wheel", text: "This is the wheel showing pool items.", selector: "#wheel" },
];

export default function Tutorial() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [hideForever, setHideForever] = useState(false);
  const [targetRect, setTargetRect] = useState<
    { top: number; left: number; width: number; height: number } | null
  >(null);
  const [measureTick, setMeasureTick] = useState(0);
  const step = STEPS[index];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("steamAuction_showTutorial");
      // If saved === "true" the user opted to hide permanently. Only auto-open when it's not true.
      if (saved !== "true") setOpen(true);
      setHideForever(saved === "true");
    } catch (e) {
      // ignore
    }
  }, []);

  // prevent background scroll while tutorial open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // re-measure on resize/scroll and when requested
  useEffect(() => {
    let raf = 0;
    const onChange = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setMeasureTick((t) => t + 1));
    };
    window.addEventListener("resize", onChange, { passive: true });
    window.addEventListener("scroll", onChange, { passive: true });
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // when open or index changes, attempt to scroll the target into view and measure
  useEffect(() => {
    if (!open) {
      setTargetRect(null);
      return;
    }

    let mounted = true;
    const measure = () => {
      if (!mounted || !step?.selector) return;
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        setTargetRect(null);
        return;
      }
      // measure relative to viewport (use fixed positioning)
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    if (step?.selector) {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        // smooth scroll into view then measure after animation
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        } catch (e) {
          // ignore
        }
      }
      // measure after a short delay to allow scroll to complete
      const t = window.setTimeout(measure, 350);
      return () => {
        mounted = false;
        clearTimeout(t);
      };
    }

    // no selector: clear
    setTargetRect(null);
    return () => {
      mounted = false;
    };
  }, [open, index, step?.selector, measureTick]);

  function close(andHide = false) {
    setOpen(false);
    if (andHide) {
      try {
        localStorage.setItem("steamAuction_showTutorial", "true");
        setHideForever(true);
      } catch (e) {}
    }
  }

  function next() {
    setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          aria-label="Show tips"
          onClick={() => { setIndex(0); setOpen(true); }}
          className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg hover:scale-105 transition-transform"
        >
          Tips
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={() => close(false)} />

          {/* highlight box */}
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
                  border: "2px solid #FFD166",
                  transition: "all 250ms ease",
                  pointerEvents: "none",
                  zIndex: 60,
                }}
              />

              {/* tooltip positioned near target */}
              <div
                style={{
                  position: "absolute",
                  top: Math.max(12, targetRect.top + targetRect.height + 10),
                  left: Math.min(targetRect.left, window.innerWidth - 360),
                  zIndex: 70,
                }}
              >
                <div className="max-w-md rounded-2xl bg-slate-900/95 p-4 text-slate-100 shadow-2xl pointer-events-auto">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{step.title}</div>
                      <div className="mt-1 text-xs text-slate-300">{step.text}</div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <button onClick={() => close(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
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
                            } catch (err) {
                              // ignore
                            }
                          }}
                        />
                        Don't show again
                      </label>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-400">Step {index + 1} / {STEPS.length}</div>
                    <div className="flex gap-2">
                      <button onClick={prev} disabled={index === 0} className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-200 disabled:opacity-50">Prev</button>
                      {index < STEPS.length - 1 ? (
                        <button onClick={next} className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-900">Next</button>
                      ) : (
                        <button onClick={() => { if (hideForever) close(true); else close(false); }} className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900">Done</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // No target or not found -> center modal
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="relative z-70 max-w-xl rounded-2xl bg-slate-900/95 p-6 text-slate-100 shadow-2xl">
                <div className="text-lg font-semibold">{step.title}</div>
                <div className="mt-2 text-sm text-slate-300">{step.text}</div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={prev} disabled={index === 0} className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-200 disabled:opacity-50">Prev</button>
                  {index < STEPS.length - 1 ? (
                    <button onClick={next} className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-900">Next</button>
                  ) : (
                    <button onClick={() => { if (hideForever) close(true); else close(false); }} className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900">Done</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
