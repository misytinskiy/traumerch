"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./FAQ.module.css";

const ChevronIcon = () => (
  <svg
    width="50"
    height="50"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.5" y="0.5" width="49" height="49" rx="24.5" stroke="black" />
    <path
      d="M18.6404 21.4643C18.828 21.2769 19.0823 21.1716 19.3474 21.1716C19.6126 21.1716 19.8669 21.2769 20.0544 21.4643L25.0044 26.4143L29.9544 21.4643C30.143 21.2822 30.3956 21.1814 30.6578 21.1837C30.92 21.1859 31.1709 21.2911 31.3563 21.4765C31.5417 21.6619 31.6468 21.9127 31.6491 22.1749C31.6514 22.4371 31.5506 22.6897 31.3684 22.8783L25.7114 28.5353C25.5239 28.7228 25.2696 28.8281 25.0044 28.8281C24.7393 28.8281 24.485 28.7228 24.2974 28.5353L18.6404 22.8783C18.453 22.6908 18.3477 22.4365 18.3477 22.1713C18.3477 21.9062 18.453 21.6519 18.6404 21.4643Z"
      fill="black"
    />
  </svg>
);

export default function FAQ() {
  const { t } = useLanguage();
  const [openedIdx, setOpenedIdx] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenedIdx(openedIdx === idx ? null : idx);
  };

  return (
    <section className={styles.faq}>
      <div className={styles.header}>
        <SectionTitle maxWidth={417}>{t.faq.title}</SectionTitle>
      </div>

      <ul className={styles.faqList}>
        {t.faq.items.map((item, index) => (
          <li
            key={index}
            className={`${styles.faqItem} ${
              openedIdx === index ? styles.open : ""
            }`}
          >
            <button
              className={styles.questionButton}
              onClick={() => toggleItem(index)}
            >
              <h3 className={styles.questionText}>{item.question}</h3>
              <div className={styles.iconButton}>
                <ChevronIcon />
              </div>
            </button>

            <div className={styles.answerWrapper}>
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
