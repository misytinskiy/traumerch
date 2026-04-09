import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, EB_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../contexts/LanguageContext";
import GtmManager from "../components/Analytics/GtmManager";
import CookieConsentManager from "../components/CookieConsent/CookieConsentManager";

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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrauMerch - Merchandise Solutions",
  description:
    "Unleashing your brand through merchandise that truly connects with your audience",
  icons: {
    icon: "/favicons/favicon.svg",
    shortcut: "/favicons/favicon.svg",
    apple: "/favicons/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("language")?.value;
  const lang = cookieLang === "de" ? "de" : "en";

  return (
    <html lang={lang}>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${inter.variable}`}
      >
        <GtmManager />
        <LanguageProvider>
          {children}
          <CookieConsentManager />
        </LanguageProvider>
      </body>
    </html>
  );
}
