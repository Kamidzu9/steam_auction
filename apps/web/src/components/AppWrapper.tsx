"use client";

import { useApi } from "../lib/ApiProvider";
import SystemSetup from "./SystemSetup";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { system } = useApi();

  if (system.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400" />
      </div>
    );
  }

  if (!system.hasSteamApiKey) {
    return <SystemSetup />;
  }

  return <>{children}</>;
}
