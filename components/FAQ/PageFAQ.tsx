"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

import Accordion from "../Accordion/Accordion";
import styles from "./PageFAQ.module.css";

export default function PageFAQ() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  // Get current tab ID
  const currentTabId = t.faq.tabs[activeTab]?.id;
  
  // Get FAQ items for the active tab
  const tabsData = (t.faq as any).tabsData;
  const faqItems = currentTabId && tabsData?.[currentTabId]
    ? tabsData[currentTabId].map((item: { question: string; answer: string }) => ({
        title: item.question,
        content: item.answer,
      }))
    : [];

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
