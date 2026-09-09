"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface PreloaderContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  hasShown: boolean;
  setHasShown: (shown: boolean) => void;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(
  undefined
);

// Temporary global switch. Keep the preloader implementation mounted so it can
// be restored without changing provider wiring.
const PRELOADER_ENABLED = false;

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(PRELOADER_ENABLED);
  const [hasShown, setHasShown] = useState(!PRELOADER_ENABLED);

  useEffect(() => {
    if (!PRELOADER_ENABLED) return;

    // Check if preloader has already been shown (persists across sessions)
    // Using localStorage so it shows only once per user, ever
    if (typeof window !== "undefined") {
      const shown = localStorage.getItem("preloaderShown");
      if (shown === "true") {
        setHasShown(true);
        setIsEnabled(false);
      }
    }
  }, []);

  const handleSetEnabled = (enabled: boolean) => {
    if (!PRELOADER_ENABLED) return;

    setIsEnabled(enabled);
    if (!enabled) {
      // Save to localStorage so preloader shows only once per user
      if (typeof window !== "undefined") {
        localStorage.setItem("preloaderShown", "true");
      }
      setHasShown(true);
    }
  };

  return (
    <PreloaderContext.Provider
      value={{
        isEnabled,
        setIsEnabled: handleSetEnabled,
        hasShown,
        setHasShown,
      }}
    >
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  const context = useContext(PreloaderContext);
  if (context === undefined) {
    throw new Error("usePreloader must be used within a PreloaderProvider");
  }
  return context;
}
