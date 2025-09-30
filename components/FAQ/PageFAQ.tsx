"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

import Accordion from "../Accordion/Accordion";
import styles from "./PageFAQ.module.css";

export default function PageFAQ() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  // FAQ items (same for all tabs for now)
  const faqItems = t.faq.items.map((item) => ({
    title: item.question,
    content: item.answer,
  }));

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <section className={styles.faqSection}>
      <h2 className={styles.title}>{t.faq.pageTitle}</h2>
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {t.faq.tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${
                activeTab === index ? styles.active : ""
              }`}
              onClick={() => handleTabClick(index)}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <Accordion items={faqItems} variant="default" />
      </div>
    </section>
  );
}
