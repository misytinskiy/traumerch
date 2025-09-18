"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./ProductAccordion.module.css";

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
      d="M18.6443 21.4645C18.8319 21.277 19.0862 21.1717 19.3513 21.1717C19.6165 21.1717 19.8708 21.277 20.0583 21.4645L25.0083 26.4145L29.9583 21.4645C30.147 21.2823 30.3996 21.1815 30.6618 21.1838C30.9239 21.1861 31.1748 21.2912 31.3602 21.4766C31.5456 21.6621 31.6507 21.9129 31.653 22.1751C31.6553 22.4373 31.5545 22.6899 31.3723 22.8785L25.7153 28.5355C25.5278 28.7229 25.2735 28.8282 25.0083 28.8282C24.7432 28.8282 24.4889 28.7229 24.3013 28.5355L18.6443 22.8785C18.4569 22.6909 18.3516 22.4366 18.3516 22.1715C18.3516 21.9063 18.4569 21.652 18.6443 21.4645Z"
      fill="black"
    />
  </svg>
);

export default function ProductAccordion() {
  const { t } = useLanguage();
  const [openedIdx, setOpenedIdx] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenedIdx(openedIdx === idx ? null : idx);
  };

  return (
    <ul className={styles.accordion}>
      {t.design.accordion.map((item, index) => (
        <li
          key={index}
          className={`${styles.accordionItem} ${
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
  );
}
