'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ServerType = 'wl-off' | 'wl-on';

interface ServerContextValue {
  server: ServerType | null;
  setServer: (s: ServerType) => void;
  clearServer: () => void;
  isReady: boolean;
}

const ServerContext = createContext<ServerContextValue>({
  server: null,
  setServer: () => {},
  clearServer: () => {},
  isReady: false,
});

export function ServerProvider({ children }: { children: ReactNode }) {
  const [server, setServerState] = useState<ServerType | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yt_selected_server') as ServerType | null;
      if (saved === 'wl-off' || saved === 'wl-on') {
        setServerState(saved);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsReady(true);
    }
  }, []);

  const setServer = (s: ServerType) => {
    setServerState(s);
    try {
      localStorage.setItem('yt_selected_server', s);
    } catch {
      // Ignore localStorage errors
    }
  };

  const clearServer = () => {
    setServerState(null);
    try {
      localStorage.removeItem('yt_selected_server');
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <ServerContext.Provider value={{ server, setServer, clearServer, isReady }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  return useContext(ServerContext);
}
