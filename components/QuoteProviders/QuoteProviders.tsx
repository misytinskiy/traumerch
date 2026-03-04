"use client";

import { CartProvider } from "../../contexts/CartContext";
import { QuoteOverlayProvider } from "../../contexts/QuoteOverlayContext";
import { PreloaderProvider } from "../../contexts/PreloaderContext";

export default function QuoteProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreloaderProvider>
      <CartProvider>
        <QuoteOverlayProvider>{children}</QuoteOverlayProvider>
      </CartProvider>
    </PreloaderProvider>
  );
}
