"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { pushDataLayerEvent } from "../shared/analytics";

interface QuoteOverlayContextType {
  isOpen: boolean;
  openQuote: (source?: string) => void;
  closeQuote: (source?: string) => void;
}

const QuoteOverlayContext =
  createContext<QuoteOverlayContextType | undefined>(undefined);

export function QuoteOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openQuote = useCallback((source?: string) => {
    if (typeof window === "undefined" || isOpen) return;
    setIsOpen(true);
    pushDataLayerEvent("quote_overlay_open", {
      source: source ?? "unknown",
    });
  }, [isOpen]);

  const closeQuote = useCallback((source?: string) => {
    if (!isOpen) return;
    setIsOpen(false);
    pushDataLayerEvent("quote_overlay_close", {
      source: source ?? "unknown",
    });
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
