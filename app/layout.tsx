import type { Metadata } from "next";
import { Geist, Geist_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../contexts/LanguageContext";
import { QuoteOverlayProvider } from "../contexts/QuoteOverlayContext";
import { PreloaderProvider } from "../contexts/PreloaderContext";
import { CartProvider } from "../contexts/CartContext";
import CartSidebar from "../components/CartSidebar/CartSidebar";
import QuoteOverlay from "../components/QuoteOverlay/QuoteOverlay";
import Preloader from "../components/Preloader/Preloader";
import SWRProvider from "../components/SWRProvider/SWRProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TrauMerch - Merchandise Solutions",
  description:
    "Unleashing your brand through merchandise that truly connects with your audience",
  icons: {
    icon: [
      {
        url: "/favicons/forLightTheme.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
      },
      {
        url: "/favicons/forDarkTheme.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicons/forLightTheme.png",
    apple: "/favicons/forLightTheme.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable}`}
      >
        <LanguageProvider>
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
        </LanguageProvider>
      </body>
    </html>
  );
}
