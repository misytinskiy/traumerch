"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { usePreloader } from "../../contexts/PreloaderContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Image from "next/image";
import styles from "./Preloader.module.css";

export default function Preloader() {
  const { hasShown, setHasShown, setIsEnabled } = usePreloader();
  const { t } = useLanguage();
  const imagesTrackRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<HTMLDivElement>(null);
  const hasStartedHiding = useRef(false);
  const [isHiding, setIsHiding] = React.useState(false);

  useEffect(() => {
    if (hasShown || !imagesTrackRef.current || !lastImageRef.current) {
      return;
    }

    let animationFrameId: number | null = null;
    let isChecking = false;

    const checkLastImagePosition = () => {
      if (hasStartedHiding.current || !isChecking) {
        return;
      }

      const lastImage = lastImageRef.current;
      if (!lastImage) {
        return;
      }

      const rect = lastImage.getBoundingClientRect();
      // Когда правая граница последнего изображения уходит за левый край экрана
      if (rect.right <= 0) {
        hasStartedHiding.current = true;
        isChecking = false;
        setIsHiding(true);
        // Останавливаем анимацию
        if (imagesTrackRef.current) {
          imagesTrackRef.current.style.animationPlayState = "paused";
        }
        // Ждем завершения анимации исчезновения перед обновлением состояния
        setTimeout(() => {
          setIsEnabled(false);
          setHasShown(true);
        }, 500); // Длительность анимации fade-out
        return;
      }

      // Продолжаем проверку
      animationFrameId = requestAnimationFrame(checkLastImagePosition);
    };

    // Небольшая задержка перед началом проверки, чтобы дать анимации время начаться
    const startCheckingTimeout = setTimeout(() => {
      isChecking = true;
      animationFrameId = requestAnimationFrame(checkLastImagePosition);
    }, 100);

    return () => {
      clearTimeout(startCheckingTimeout);
      isChecking = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [hasShown, setHasShown, setIsEnabled]);

  // Only render if not shown before
  if (hasShown) {
    return null;
  }

  return (
    <motion.div
      className={styles.preloader}
      initial={{ opacity: 1 }}
      animate={{ opacity: isHiding ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className={styles.content}>
        {/* First text */}
        <div className={styles.text1Wrapper}>
          <motion.div
            className={styles.text1}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.7,
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
            duration: 0.9,
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
          <div
            ref={imagesTrackRef}
            className={`${styles.imagesTrack} ${styles.animated}`}
          >
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
            <div ref={lastImageRef} className={styles.imageWrapper}>
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
    </motion.div>
  );
}
