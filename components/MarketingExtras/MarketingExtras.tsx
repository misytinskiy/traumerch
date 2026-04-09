"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import GlassBanner from "../GlassBanner/GlassBanner";

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_CONSENT_ACCEPTED = "accepted";
const COOKIE_CONSENT_REJECTED = "rejected";

const getCookieConsentValue = () => {
  if (typeof document === "undefined") return null;
  const pair = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_KEY}=`));
  if (!pair) return null;
  return pair.split("=")[1] ?? null;
};

export default function MarketingExtras() {
  const pathname = usePathname();
  const [consentResolved, setConsentResolved] = useState(false);
  const [consentValue, setConsentValue] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncConsent = () => {
      const consent = getCookieConsentValue() || localStorage.getItem(COOKIE_CONSENT_KEY);
      setConsentValue(consent);
      setConsentResolved(true);
    };

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setConsentValue(customEvent.detail);
      setConsentResolved(true);
    };

    syncConsent();
    window.addEventListener("cookie-consent-updated", handleConsentUpdated);

    return () => {
      window.removeEventListener("cookie-consent-updated", handleConsentUpdated);
    };
  }, []);

  if (pathname !== "/") return null;
  if (!consentResolved) return null;
  if (
    consentValue !== COOKIE_CONSENT_ACCEPTED &&
    consentValue !== COOKIE_CONSENT_REJECTED
  ) {
    return null;
  }
  return <GlassBanner />;
}
