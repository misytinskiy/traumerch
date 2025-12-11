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

export function PreloaderProvider({ children }: { children: ReactNode }) {
  // Preloader enabled for all devices including mobile/tablet
  const [isEnabled, setIsEnabled] = useState(true);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
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
