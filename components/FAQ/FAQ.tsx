"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Accordion from "../Accordion/Accordion";
import styles from "./FAQ.module.css";

export default function FAQ() {
  const { t } = useLanguage();

  // Transform FAQ data to accordion format
  const accordionItems = t.faq.items.map((item) => ({
    title: item.question,
    content: item.answer,
  }));

  return (
    <section className={styles.faq}>
      <div className={styles.header}>
        <SectionTitle maxWidth={417}>{t.faq.title}</SectionTitle>
      </div>

      <Accordion items={accordionItems} variant="default" />
    </section>
  );
}
