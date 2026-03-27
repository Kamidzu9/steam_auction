"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ApiClient } from "@steam-auction/api-client";

const isDesktop =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (isDesktop ? "http://127.0.0.1:3001" : "http://localhost:3001");

interface AuthState {
  accessToken: string | null;
  isLoading: boolean;
}

interface SystemState {
  configured: boolean;
  hasSteamApiKey: boolean;
  isLoading: boolean;
}

interface ApiContextValue {
  client: ApiClient;
  accessToken: string | null;
  isLoading: boolean;
  setAccessToken: (token: string | null) => void;
  system: SystemState;
  refreshSystemStatus: () => Promise<void>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    accessToken: null,
    isLoading: true,
  });

  const [system, setSystem] = useState<SystemState>({
    configured: false,
    hasSteamApiKey: false,
    isLoading: true,
  });

  const setAccessToken = useCallback((token: string | null) => {
    setAuth({ accessToken: token, isLoading: false });
  }, []);

  const refreshSystemStatus = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      const status = await clientRef.current.getSystemStatus();
      setSystem({
        configured: status.configured,
        hasSteamApiKey: status.hasSteamApiKey,
        isLoading: false,
      });
    } catch (err) {
      setSystem((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const clientRef = useRef<ApiClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = new ApiClient({
      baseUrl: API_URL,
      getAccessToken: () => auth.accessToken,
      onRefresh: async () => {
        try {
          const result = await clientRef.current!.refresh();
          setAccessToken(result.accessToken);
          return result.accessToken;
        } catch {
          setAccessToken(null);
          return null;
        }
      },
      onAuthFailure: () => setAccessToken(null),
    });
  }

  // On mount: attempt a silent refresh to restore session from httpOnly cookie.
  useEffect(() => {
    refreshSystemStatus();

    clientRef
      .current!.refresh()
      .then((result) => setAccessToken(result.accessToken))
      .catch(() => setAuth({ accessToken: null, isLoading: false }));
  }, [setAccessToken, refreshSystemStatus]);

  return (
    <ApiContext.Provider
      value={{
        client: clientRef.current,
        accessToken: auth.accessToken,
        isLoading: auth.isLoading,
        setAccessToken,
        system,
        refreshSystemStatus,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used inside ApiProvider");
  return ctx;
}
