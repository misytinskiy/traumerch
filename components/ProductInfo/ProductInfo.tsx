"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./ProductInfo.module.css";

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

const LeftArrowIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="36"
      height="36"
      rx="18"
      transform="matrix(-1 0 0 1 36 0)"
      fill="black"
      fillOpacity="0.4"
    />
    <path
      d="M15.36 13.4081L10.768 18.0001M10.768 18.0001L15.36 22.5921M10.768 18.0001H25.2266"
      stroke="white"
      strokeWidth="0.918667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RightArrowIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="36" height="36" rx="18" fill="black" fillOpacity="0.4" />
    <path
      d="M20.64 13.4081L25.232 18.0001M25.232 18.0001L20.64 22.5921M25.232 18.0001H10.7734"
      stroke="white"
      strokeWidth="0.918667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ProductInfo() {
  const { t } = useLanguage();
  const [openedIdx, setOpenedIdx] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const toggleItem = (idx: number) => {
    setOpenedIdx(openedIdx === idx ? null : idx);
  };

  const totalSlides = 5;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section className={styles.productInfo}>
      <div className={styles.infoSection}>
        <h2 className={styles.title}>{t.design.knowYourProduct}</h2>

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
      </div>

      <div className={styles.sliderSection}>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderImage} />

          <button
            className={`${styles.sliderNav} ${styles.prev}`}
            onClick={prevSlide}
            aria-label="Previous image"
          >
            <LeftArrowIcon />
          </button>

          <button
            className={`${styles.sliderNav} ${styles.next}`}
            onClick={nextSlide}
            aria-label="Next image"
          >
            <RightArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
