import type { Metadata } from "next";
import { Geist, Geist_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../contexts/LanguageContext";
import { QuoteOverlayProvider } from "../contexts/QuoteOverlayContext";
import QuoteOverlay from "../components/QuoteOverlay/QuoteOverlay";

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
          <QuoteOverlayProvider>
            {children}
            <QuoteOverlay />
          </QuoteOverlayProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
