"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_CONSENT_ACCEPTED = "accepted";
const GTM_ID = "GTM-PQJMHCXQ";

const getCookieConsentValue = () => {
  if (typeof document === "undefined") return null;
  const pair = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_KEY}=`));
  if (!pair) return null;
  return pair.split("=")[1] ?? null;
};

export default function GtmManager() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncConsent = () => {
      const consent =
        getCookieConsentValue() || localStorage.getItem(COOKIE_CONSENT_KEY);
      setEnabled(consent === COOKIE_CONSENT_ACCEPTED);
    };

    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setEnabled(customEvent.detail === COOKIE_CONSENT_ACCEPTED);
    };

    syncConsent();
    window.addEventListener("cookie-consent-updated", handleConsentUpdated);

    return () => {
      window.removeEventListener("cookie-consent-updated", handleConsentUpdated);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>

      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
