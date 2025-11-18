"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
import styles from "./CTA.module.css";

export default function CTA() {
  const { t } = useLanguage();

  return (
    <section className={styles.cta}>
      <div className={styles.title}>
        <SectionTitle maxWidth={900}>{t.cta.title}</SectionTitle>
      </div>

      <p className={styles.description}>{t.cta.description}</p>

      <Button
        variant="solid"
        padding="32px 44px"
        padding768="42px 73px"
        padding350="26px 38px"
        arrow="white"
      >
        {t.cta.buttonText}
      </Button>
    </section>
  );
}
