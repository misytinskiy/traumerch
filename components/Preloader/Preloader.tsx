"use client";

import React from "react";
import { usePreloader } from "../../contexts/PreloaderContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Image from "next/image";
import styles from "./Preloader.module.css";

export default function Preloader() {
  const { hasShown } = usePreloader();
  const { t } = useLanguage();

  // Only render if not shown before
  if (hasShown) {
    return null;
  }

  return (
    <div className={styles.preloader}>
      <div className={styles.content}>
        {/* First text */}
        <div className={styles.text1}>{t.preloader?.text1 || "TrauMerch"}</div>

        {/* Second text */}
        <div className={styles.text2}>
          We create branded merchandise for employees and events that brings
          people together. From welcome kits and team gear to conference
          giveaways, our solutions ensure every item strengthens connection and
          brand culture.
        </div>

        {/* Images container */}
        <div className={styles.imagesContainer}>
          <div className={styles.imagesTrack}>
            <div className={styles.imageWrapper}>
              <Image
                src="/services/1.png"
                alt="Service 1"
                width={652}
                height={420}
                className={styles.image}
                priority
              />
            </div>
            <div className={styles.imageWrapper}>
              <Image
                src="/services/2.png"
                alt="Service 2"
                width={652}
                height={420}
                className={styles.image}
                priority
              />
            </div>
            <div className={styles.imageWrapper}>
              <Image
                src="/services/3.png"
                alt="Service 3"
                width={652}
                height={420}
                className={styles.image}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
