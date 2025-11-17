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
  const [isEnabled, setIsEnabled] = useState(false); // Temporarily disabled
  const [hasShown, setHasShown] = useState(true); // Temporarily disabled

  useEffect(() => {
    // Check if preloader has already been shown in this session
    // Temporarily disabled for testing - uncomment to enable session-based preloader
    // const shown = sessionStorage.getItem("preloaderShown");
    // if (shown === "true") {
    //   setHasShown(true);
    //   setIsEnabled(false);
    // }
  }, []);

  const handleSetEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      sessionStorage.setItem("preloaderShown", "true");
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

