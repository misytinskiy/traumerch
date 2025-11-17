"use client";

import React from "react";
import { motion } from "framer-motion";
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
        <div className={styles.text1Wrapper}>
          <motion.div
            className={styles.text1}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {t.preloader?.text1 || "TrauMerch"}
          </motion.div>
        </div>

        {/* Second text */}
        <motion.div
          className={styles.text2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 1.1,
          }}
        >
          We create branded merchandise for employees and events that brings
          people together. From welcome kits and team gear to conference
          giveaways, our solutions ensure every item strengthens connection and
          brand culture.
        </motion.div>

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
