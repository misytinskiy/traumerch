"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./OurPromisesMobile.module.css";

export default function OurPromisesMobile() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const promises = t.promises.items;

  return (
    <section className={styles.ourPromisesMobile}>
      {/* <div className={styles.container}> */}
      {/* Section title */}
      <h2 className={styles.sectionTitle}>{t.promises.topText}</h2>

      {/* Cards in column */}
      <div className={styles.cardsContainer}>
        {promises.map((promise, index) => (
          <div key={index} className={styles.card}>
            {/* Promise heading */}
            <h3 className={styles.promiseHeading}>{promise.heading}</h3>

            {/* Gray square */}
            <div className={styles.imagePlaceholder}>
              <div className={styles.graySquare}></div>
            </div>

            {/* Phrase */}
            <h3 className={styles.phrase}>{promise.phrase}</h3>

            {/* Description */}
            <p className={styles.description}>
              {promise.description.split("*").map((part, partIndex) => {
                if (partIndex === 0) return part;
                return (
                  <span key={partIndex}>
                    <span className={styles.asteriskText}>*{part}</span>
                  </span>
                );
              })}
            </p>

            {/* See More button */}
            <div className={styles.buttonContainer}>
              <Button
                variant="solid"
                padding="41px 112px"
                padding350="26px 73px"
                arrow="white"
                size="small"
              >
                SEE MORE
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* </div> */}
    </section>
  );
}
