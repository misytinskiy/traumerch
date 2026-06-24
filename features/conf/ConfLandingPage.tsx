"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  QuoteOverlayProvider,
  useQuoteOverlay,
} from "../../contexts/QuoteOverlayContext";
import { CartProvider } from "../../contexts/CartContext";
import { PreloaderProvider } from "../../contexts/PreloaderContext";
import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import { pushDataLayerEvent } from "../../shared/analytics";
import ConfQuoteOverlay from "./ConfQuoteOverlay";
import {
  ConfTrackingContext,
  createScanId,
  fireConfPageviewOnce,
  getOrCreateVisitorId,
  markVisited,
  readIsUniqueVisitor,
} from "./confTracking";
import styles from "./ConfLandingPage.module.css";

type Language = "en" | "de";

interface ConfCopy {
  eyebrowConf: string;
  eyebrowRest: string;
  h1a: string;
  h1b: string;
  h1c: string;
  heroSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  bandTitle: string;
  bandImageAlt: string;
  rows: {
    badge: string;
    title: string;
    /** Optional second title line; when present rendered after a <br/>. */
    titleLine2?: string;
    description: string;
    imageAlt: string;
    image: string;
  }[];
  finalCtaTitleLine1: string;
  finalCtaTitleLine2: string;
  finalCtaDesc: string;
  fooExplore: string;
  fooLegal: string;
  fooConnect: string;
  fooContact: string;
  fooServices: string;
  fooInspiration: string;
  fooPortfolio: string;
  fooFaq: string;
  fooImprint: string;
  fooPrivacy: string;
  fooCookie: string;
  fooTerms: string;
  fooLinkedIn: string;
  fooInstagram: string;
  fooAddress: string;
  fooRights: string;
}

const COPY: Record<Language, ConfCopy> = {
  en: {
    eyebrowConf: "GGATE26 Conference",
    eyebrowRest: "Custom branded merchandise",
    h1a: "You scanned the back.",
    h1b: "Now let's make merch",
    h1c: "worth scanning.",
    heroSub:
      "TrauMerch creates custom branded products for conferences, teams, launches and corporate campaigns — produced on demand and delivered fast.",
    ctaPrimary: "Request a Quote",
    ctaSecondary: "View what we make",
    bandTitle: "The merch everyone at the table remembers.",
    bandImageAlt: "Custom branded apparel at the venue",
    rows: [
      {
        badge: "Built for the floor",
        title: "Booth & conference merch",
        description:
          "Stand out on a crowded floor and give people a reason to stop by. Staff apparel, welcome kits and giveaways that outlast the after-party.",
        imageAlt: "Booth & conference merchandise",
        image: "/services/1.png",
      },
      {
        badge: "Gifts that land",
        title: "VIP & high-roller gifts",
        description:
          "Premium gifts for partners, affiliates and VIP guests — curated boxes and tailored packaging that match the stakes.",
        imageAlt: "VIP and high-roller gifts",
        image: "/gallery/4.jpg",
      },
      {
        badge: "Wear the brand",
        title: "Team apparel",
        titleLine2: "& limited drops",
        description:
          "Custom apparel, headwear and limited drops that turn your team — and your players — into the brand.",
        imageAlt: "Team apparel close-up with branded label",
        image: "/services/3.png",
      },
    ],
    finalCtaTitleLine1: "Need merch for",
    finalCtaTitleLine2: "your next event?",
    finalCtaDesc:
      "Let's bring your ideas to life — from first design to delivery, simple and reliable.",
    fooExplore: "Explore",
    fooLegal: "Legal & Policies",
    fooConnect: "Stay Connected",
    fooContact: "Get in Touch",
    fooServices: "Services",
    fooInspiration: "Inspiration",
    fooPortfolio: "Portfolio",
    fooFaq: "FAQ",
    fooImprint: "Imprint",
    fooPrivacy: "Privacy Policy",
    fooCookie: "Cookie Policy",
    fooTerms: "Terms & Conditions",
    fooLinkedIn: "LinkedIn",
    fooInstagram: "Instagram",
    fooAddress: "Tuchlauben 7A, 1010, Vienna, Austria",
    fooRights: "All rights reserved.",
  },
  de: {
    eyebrowConf: "GGATE26 Conference",
    eyebrowRest: "Individuelles Marken-Merch",
    h1a: "Sie haben gescannt.",
    h1b: "Jetzt machen wir Merch,",
    h1c: "das man scannen will.",
    heroSub:
      "TrauMerch produziert individuelles Marken-Merch für Konferenzen, Teams, Launches und Kampagnen — on demand und schnell geliefert.",
    ctaPrimary: "Angebot anfordern",
    ctaSecondary: "Was wir machen",
    bandTitle: "Das Merch, an das sich alle am Tisch erinnern.",
    bandImageAlt: "Individuell gebrandete Apparel am Veranstaltungsort",
    rows: [
      {
        badge: "Für den Messeboden",
        title: "Messe- & Konferenz-Merch",
        description:
          "Fallen Sie auf dem vollen Messeboden auf. Team-Bekleidung, Welcome-Kits und Giveaways, die die After-Party überdauern.",
        imageAlt: "Messe- und Konferenz-Merchandise",
        image: "/services/1.png",
      },
      {
        badge: "Geschenke, die ankommen",
        title: "VIP- & High-Roller-Geschenke",
        description:
          "Premium-Geschenke für Partner, Affiliates und VIP-Gäste — kuratierte Boxen und Verpackung, die zum Einsatz passen.",
        imageAlt: "VIP- und High-Roller-Geschenke",
        image: "/gallery/4.jpg",
      },
      {
        badge: "Trag die Marke",
        title: "Team-Bekleidung",
        titleLine2: "& Limited Drops",
        description:
          "Individuelle Bekleidung, Caps und Limited Drops, die Ihr Team — und Ihre Spieler — zur Marke machen.",
        imageAlt: "Team-Bekleidung Nahaufnahme mit Marken-Label",
        image: "/services/3.png",
      },
    ],
    finalCtaTitleLine1: "Merch für",
    finalCtaTitleLine2: "Ihr nächstes Event?",
    finalCtaDesc:
      "Wir bringen Ihre Ideen zum Leben — vom ersten Entwurf bis zur Lieferung, einfach und zuverlässig.",
    fooExplore: "Entdecken",
    fooLegal: "Recht & Dokumente",
    fooConnect: "Folgen Sie uns",
    fooContact: "Kontakt aufnehmen",
    fooServices: "Leistungen",
    fooInspiration: "Inspiration",
    fooPortfolio: "Portfolio",
    fooFaq: "FAQ",
    fooImprint: "Impressum",
    fooPrivacy: "Datenschutzerklärung",
    fooCookie: "Cookie-Richtlinie",
    fooTerms: "AGB",
    fooLinkedIn: "LinkedIn",
    fooInstagram: "Instagram",
    fooAddress: "Tuchlauben 7A, 1010, Vienna, Austria",
    fooRights: "Alle Rechte vorbehalten.",
  },
};

export default function ConfLandingPage() {
  // Wrap in the same contexts that the project-wide ResponsiveHeader expects.
  // Note: we deliberately do NOT render the original <QuoteOverlay /> here —
  // ConfQuoteOverlay listens to the same QuoteOverlayContext so the header's
  // REQUEST A QUOTE button opens the conf-tracked overlay (with the conf
  // sourceKey/campaign payload), not the marketing-wide one.
  return (
    <PreloaderProvider>
      <QuoteOverlayProvider>
        <CartProvider>
          <ConfLandingPageInner />
        </CartProvider>
      </QuoteOverlayProvider>
    </PreloaderProvider>
  );
}

function ConfLandingPageInner() {
  const { language } = useLanguage();
  const safeLanguage: Language = language === "de" ? "de" : "en";
  const copy = COPY[safeLanguage];

  const { isOpen, openQuote, closeQuote } = useQuoteOverlay();

  // Tracking IDs are stable per page open; build them once during the initial render.
  const tracking = useRef<ConfTrackingContext | null>(null);
  if (tracking.current === null && typeof window !== "undefined") {
    const isUnique = readIsUniqueVisitor();
    tracking.current = {
      visitorId: getOrCreateVisitorId(),
      scanId: createScanId(),
      isUniqueVisitor: isUnique,
    };
  }
  const trackingContext: ConfTrackingContext = tracking.current ?? {
    visitorId: "",
    scanId: "",
    isUniqueVisitor: true,
  };

  useEffect(() => {
    if (!tracking.current) return;
    // Persist the visited flag AFTER the unique value has been frozen into
    // `tracking.current.isUniqueVisitor`, so the first scan is reported as
    // unique and subsequent scans flip to false.
    markVisited();
    fireConfPageviewOnce({
      visitorId: tracking.current.visitorId,
      scanId: tracking.current.scanId,
      isUniqueVisitor: tracking.current.isUniqueVisitor,
      language: safeLanguage,
    });
    pushDataLayerEvent("conf_pageview", {
      page: "/conf",
      campaign: "ggate26",
      source: "conf_qr",
      scan_id: tracking.current.scanId,
      visitor_id: tracking.current.visitorId,
      is_unique_visitor: tracking.current.isUniqueVisitor,
      language: safeLanguage,
    });
  }, [safeLanguage]);

  const openConfQuote = useCallback(
    (source: string) => {
      openQuote(source);
      pushDataLayerEvent("conf_quote_cta_click", {
        source,
        scan_id: trackingContext.scanId,
      });
    },
    [openQuote, trackingContext.scanId]
  );

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    if (typeof document === "undefined") return;
    const target = document.getElementById(targetId);
    if (!target) return;
    e.preventDefault();
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - 24;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const yearText = useMemo(
    () => `${new Date().getFullYear()} TrauMerch©`,
    []
  );

  return (
    <div className={styles.root}>
      <ResponsiveHeader />

      {/* HERO */}
      <section id="top" className={styles.hero}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowAccent}>{copy.eyebrowConf}</span>{" "}
          <span aria-hidden>·</span> {copy.eyebrowRest}
        </p>
        <h1 className={`${styles.eb} ${styles.heroTitle}`}>
          {copy.h1a}
          <br />
          {copy.h1b}
          <br />
          <span className={styles.heroItalic}>{copy.h1c}</span>
        </h1>
        <p className={styles.heroSub}>{copy.heroSub}</p>
        <div className={styles.heroCtas}>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => openConfQuote("conf_hero")}
          >
            <span>{copy.ctaPrimary}</span>
            <span aria-hidden className={styles.ctaArrow}>→</span>
          </button>
          <a
            href="#make"
            className={styles.secondaryCta}
            onClick={(e) => handleAnchorClick(e, "make")}
          >
            {copy.ctaSecondary}
          </a>
        </div>
      </section>

      {/* SCAN BAND */}
      <section className={styles.bandSection}>
        <div className={styles.band}>
          <Image
            src="/inspiration/1.png"
            alt={copy.bandImageAlt}
            fill
            className={styles.bandImage}
            sizes="(max-width: 1320px) 100vw, 1320px"
            priority
          />
          <div className={styles.bandOverlay} aria-hidden />
          <div className={styles.bandFrame} aria-hidden>
            <span className={`${styles.corner} ${styles.cornerTL}`} />
            <span className={`${styles.corner} ${styles.cornerTR}`} />
            <span className={`${styles.corner} ${styles.cornerBL}`} />
            <span className={`${styles.corner} ${styles.cornerBR}`} />
            <span className={styles.scanline} />
          </div>
          <div className={styles.bandCaption}>
            <h2 className={`${styles.eb} ${styles.bandTitle}`}>
              {copy.bandTitle}
            </h2>
          </div>
        </div>
      </section>

      {/* SERVICES (alternating rows) */}
      <section id="make" className={styles.makeSection}>
        <div className={styles.makeInner}>
          {copy.rows.map((row, index) => {
            const reversed = index === 1;
            return (
              <div
                key={row.title}
                className={`${styles.row} ${
                  reversed ? styles.rowReversed : ""
                }`}
              >
                <div className={styles.rowText}>
                  <p className={styles.rowBadge}>{row.badge}</p>
                  <h3 className={`${styles.eb} ${styles.rowTitle}`}>
                    {row.title}
                    {row.titleLine2 ? (
                      <>
                        <br />
                        {row.titleLine2}
                      </>
                    ) : null}
                  </h3>
                  <p className={styles.rowDescription}>{row.description}</p>
                </div>
                <div className={styles.rowMedia}>
                  <Image
                    src={row.image}
                    alt={row.imageAlt}
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 1320px) 50vw, 600px"
                    className={styles.rowImage}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2 className={`${styles.eb} ${styles.finalCtaTitle}`}>
            {copy.finalCtaTitleLine1}
            <br />
            {copy.finalCtaTitleLine2}
          </h2>
          <p className={styles.finalCtaDesc}>{copy.finalCtaDesc}</p>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => openConfQuote("conf_final_cta")}
          >
            <span>{copy.ctaPrimary}</span>
            <span aria-hidden className={styles.ctaArrow}>→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <a href="#top" className={styles.footerLogo} aria-label="TrauMerch">
              <Image
                src="/logo.svg"
                alt=""
                width={110}
                height={108}
                className={styles.footerLogoImage}
              />
            </a>
            <div className={styles.footerColumns}>
              <div className={styles.footerColumn}>
                <div className={styles.footerColumnTitle}>{copy.fooExplore}</div>
                <div className={styles.footerLinks}>
                  <a href="https://www.traumerch.com/solutions">
                    {copy.fooServices}
                  </a>
                  <a href="https://www.traumerch.com/inspiration">
                    {copy.fooInspiration}
                  </a>
                  <a href="https://www.traumerch.com/#gallery">
                    {copy.fooPortfolio}
                  </a>
                  <a href="https://www.traumerch.com/faq">{copy.fooFaq}</a>
                </div>
              </div>
              <div className={styles.footerColumn}>
                <div className={styles.footerColumnTitle}>{copy.fooLegal}</div>
                <div className={styles.footerLinks}>
                  <a href="https://www.traumerch.com/policies">
                    {copy.fooImprint}
                  </a>
                  <a href="https://www.traumerch.com/policies">
                    {copy.fooPrivacy}
                  </a>
                  <a href="https://www.traumerch.com/policies">
                    {copy.fooCookie}
                  </a>
                  <a href="https://www.traumerch.com/policies">
                    {copy.fooTerms}
                  </a>
                </div>
              </div>
              <div className={styles.footerColumn}>
                <div className={styles.footerColumnTitle}>{copy.fooConnect}</div>
                <div className={styles.footerLinks}>
                  <a
                    href="https://www.linkedin.com/company/traumerch/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.fooLinkedIn}
                  </a>
                  <a
                    href="https://www.instagram.com/traumerch"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.fooInstagram}
                  </a>
                </div>
              </div>
              <div className={styles.footerColumn}>
                <div className={styles.footerColumnTitle}>{copy.fooContact}</div>
                <div className={styles.footerLinks}>
                  <span>{copy.fooAddress}</span>
                  <a href="mailto:sales@traumerch.com">sales@traumerch.com</a>
                  <a href="mailto:operations@traumerch.com">
                    operations@traumerch.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>{yearText}</span>
            <span>{copy.fooRights}</span>
          </div>
        </div>
      </footer>

      <ConfQuoteOverlay
        open={isOpen}
        onClose={() => closeQuote("conf_overlay")}
        language={safeLanguage}
        tracking={trackingContext}
      />
    </div>
  );
}
