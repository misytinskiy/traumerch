import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, EB_Garamond, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "../contexts/LanguageContext";
import GtmManager from "../components/Analytics/GtmManager";

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
  const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_CBID;
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("language")?.value;
  const lang = cookieLang === "de" ? "de" : "en";

  return (
    <html lang={lang}>
      <head>
        {cookiebotId ? (
          <Script
            id="Cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid={cookiebotId}
            data-blockingmode="auto"
            strategy="beforeInteractive"
          />
        ) : null}
        <Script
          id="gtag-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-L0E8LG3KVT"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-consent-default"
          data-cookieconsent="ignore"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_personalization': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'analytics_storage': 'denied',
  'functionality_storage': 'denied',
  'personalization_storage': 'denied',
  'security_storage': 'granted',
  'wait_for_update': 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', false);`,
          }}
        />
        <Script
          id="gtag-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `gtag('js', new Date());
gtag('config', 'G-L0E8LG3KVT');`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${inter.variable}`}
      >
        <GtmManager />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
