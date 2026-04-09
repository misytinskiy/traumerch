"use client";

import { useEffect, useState } from "react";
import CookieBanner from "../CookieBanner/CookieBanner";

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

export default function CookieConsentManager() {
  const [consentResolved, setConsentResolved] = useState(false);
  const [consentValue, setConsentValue] = useState<string | null>(null);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const consent = getCookieConsentValue() || localStorage.getItem(COOKIE_CONSENT_KEY);
    setConsentValue(consent);
    setConsentResolved(true);

    const handleOpenSettings = () => {
      setForceOpen(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);

    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  const setConsent = (value: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${COOKIE_CONSENT_KEY}=${value}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setConsentValue(value);
    setForceOpen(false);
    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated", {
        detail: value,
      })
    );
  };

  if (!consentResolved) return null;

  const hasDecision =
    consentValue === COOKIE_CONSENT_ACCEPTED ||
    consentValue === COOKIE_CONSENT_REJECTED;

  if (!forceOpen && hasDecision) return null;

  return (
    <CookieBanner
      onAccept={() => setConsent(COOKIE_CONSENT_ACCEPTED)}
      onReject={() => setConsent(COOKIE_CONSENT_REJECTED)}
    />
  );
}
