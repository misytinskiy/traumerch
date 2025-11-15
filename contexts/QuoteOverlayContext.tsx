"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

interface QuoteOverlayContextType {
  isOpen: boolean;
  openQuote: () => void;
  closeQuote: () => void;
}

const QuoteOverlayContext =
  createContext<QuoteOverlayContextType | undefined>(undefined);

export function QuoteOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  const openQuote = useCallback(() => {
    if (typeof window === "undefined" || isOpen) return;
    previousPathRef.current = window.location.pathname + window.location.search;
    window.history.pushState({ quote: true }, "", "/quote");
    setIsOpen(true);
  }, [isOpen]);

  const closeQuote = useCallback(() => {
    if (!isOpen) return;
    setIsOpen(false);
    const target = previousPathRef.current || "/";
    window.history.replaceState(null, "", target);
  }, [isOpen]);

  return (
    <QuoteOverlayContext.Provider value={{ isOpen, openQuote, closeQuote }}>
      {children}
    </QuoteOverlayContext.Provider>
  );
}

export function useQuoteOverlay() {
  const context = useContext(QuoteOverlayContext);
  if (!context) {
    throw new Error("useQuoteOverlay must be used within QuoteOverlayProvider");
  }
  return context;
}
