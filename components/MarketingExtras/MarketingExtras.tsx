"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import GlassBanner from "../GlassBanner/GlassBanner";

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIEBOT_CONSENT_KEY = "CookieConsent";

const hasCookiebotConsentDecision = () => {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith(`${COOKIEBOT_CONSENT_KEY}=`));
};

export default function MarketingExtras() {
  const pathname = usePathname();
  const [consentResolved, setConsentResolved] = useState(false);
  const [hasDecision, setHasDecision] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncConsent = () => {
      const legacyConsent =
        document.cookie
          .split(";")
          .map((part) => part.trim())
          .some((part) => part.startsWith(`${COOKIE_CONSENT_KEY}=`)) ||
        Boolean(localStorage.getItem(COOKIE_CONSENT_KEY));
      setHasDecision(hasCookiebotConsentDecision() || legacyConsent);
      setConsentResolved(true);
    };

    syncConsent();
    window.addEventListener("CookiebotOnConsentReady", syncConsent);
    window.addEventListener("CookiebotOnAccept", syncConsent);
    window.addEventListener("CookiebotOnDecline", syncConsent);
    window.addEventListener("cookie-consent-updated", syncConsent);

    return () => {
      window.removeEventListener("CookiebotOnConsentReady", syncConsent);
      window.removeEventListener("CookiebotOnAccept", syncConsent);
      window.removeEventListener("CookiebotOnDecline", syncConsent);
      window.removeEventListener("cookie-consent-updated", syncConsent);
    };
  }, []);

  if (pathname !== "/") return null;
  if (!consentResolved) return null;
  if (!hasDecision) {
    return null;
  }
  return <GlassBanner />;
}
