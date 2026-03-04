"use client";

import { QuoteOverlayProvider } from "../../contexts/QuoteOverlayContext";
import { PreloaderProvider } from "../../contexts/PreloaderContext";
import { CartProvider } from "../../contexts/CartContext";
import SWRProvider from "../SWRProvider/SWRProvider";
import CartSidebar from "../CartSidebar/CartSidebar";
import QuoteOverlay from "../QuoteOverlay/QuoteOverlay";
import Preloader from "../Preloader/Preloader";

export default function MarketingProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreloaderProvider>
      <QuoteOverlayProvider>
        <CartProvider>
          <SWRProvider>
            <Preloader />
            {children}
            <QuoteOverlay />
            <CartSidebar />
          </SWRProvider>
        </CartProvider>
      </QuoteOverlayProvider>
    </PreloaderProvider>
  );
}
