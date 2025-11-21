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

  const openQuote = useCallback(() => {
    if (typeof window === "undefined" || isOpen) return;
    setIsOpen(true);
  }, [isOpen]);

  const closeQuote = useCallback(() => {
    if (!isOpen) return;
    setIsOpen(false);
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
