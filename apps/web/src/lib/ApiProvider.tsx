"use client";

import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";
import { ApiClient } from "@steam-auction/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface AuthState {
  accessToken: string | null;
  isLoading: boolean;
}

interface ApiContextValue {
  client: ApiClient;
  accessToken: string | null;
  isLoading: boolean;
  setAccessToken: (token: string | null) => void;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ accessToken: null, isLoading: true });

  const setAccessToken = useCallback((token: string | null) => {
    setAuth({ accessToken: token, isLoading: false });
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
    clientRef.current!.refresh()
      .then((result) => setAccessToken(result.accessToken))
      .catch(() => setAuth({ accessToken: null, isLoading: false }));
  }, [setAccessToken]);

  return (
    <ApiContext.Provider
      value={{
        client: clientRef.current,
        accessToken: auth.accessToken,
        isLoading: auth.isLoading,
        setAccessToken,
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
