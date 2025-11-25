"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
import styles from "./CTA.module.css";

export default function CTA() {
  const { t } = useLanguage();
  const { openQuote } = useQuoteOverlay();

  return (
    <section className={styles.cta}>
      <div className={styles.title}>
        <SectionTitle maxWidth={900}>{t.cta.title}</SectionTitle>
      </div>

      <p className={styles.description}>{t.cta.description}</p>

      <Button
        variant="solid"
        padding="32px 44px"
        padding1536="20px 48px"
        padding768="42px 73px"
        padding350="26px 38px"
        arrow="white"
        onClick={openQuote}
      >
        {t.cta.buttonText}
      </Button>
    </section>
  );
}
