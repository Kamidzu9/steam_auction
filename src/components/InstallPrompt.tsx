"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  async function install() {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setVisible(false);
      setPromptEvent(null);
      console.log("Install prompt choice", choice);
    } catch (e) {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        onClick={install}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
      >
        Install App
      </button>
    </div>
  );
}
