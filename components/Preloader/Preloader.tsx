"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePreloader } from "../../contexts/PreloaderContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Image from "next/image";
import styles from "./Preloader.module.css";

export default function Preloader() {
  const pathname = usePathname();
  const { hasShown, setHasShown, setIsEnabled } = usePreloader();
  const { t } = useLanguage();
  const imagesTrackRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const completionHandled = useRef(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const hasStartedHiding = useRef(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isTextDetached, setIsTextDetached] = useState(false);
  const [showFloatingText, setShowFloatingText] = useState(false);
  const [floatingData, setFloatingData] = useState<{
    sourceRect: DOMRect;
    targetRect: DOMRect;
    scale: number;
    startColor: string;
    targetColor: string;
  } | null>(null);

  // Only show preloader on home page
  const isHomePage = pathname === "/";

  const finishPreloader = useCallback(() => {
    if (completionHandled.current) return;
    completionHandled.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsEnabled(false);
    setHasShown(true);
  }, [setHasShown, setIsEnabled]);

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

  useEffect(() => {
    if (!isHiding) return;

    const textElement = text1Ref.current;
    const logoElement = document.getElementById("header-logo-anchor");

    if (textElement && logoElement) {
      const sourceRect = textElement.getBoundingClientRect();
      const targetRect = logoElement.getBoundingClientRect();
      const widthScale =
        sourceRect.width && targetRect.width
          ? targetRect.width / sourceRect.width
          : 1;
      const sourceFontSize = parseFloat(
        window.getComputedStyle(textElement).fontSize || "100"
      );
      const targetFontSize = parseFloat(
        window.getComputedStyle(logoElement).fontSize || "36"
      );
      const fontScale =
        sourceFontSize && targetFontSize ? targetFontSize / sourceFontSize : 1;
      const scale = widthScale > 0 ? widthScale : fontScale > 0 ? fontScale : 1; // prefer rendered width to better match logo across breakpoints
      const measuredStartColor =
        window.getComputedStyle(textElement).color || "rgba(255, 255, 255, 1)";
      const startColor =
        measuredStartColor === "rgb(255, 255, 255)" ||
        measuredStartColor === "rgba(255, 255, 255, 1)"
          ? "rgba(0, 0, 0, 1)"
          : measuredStartColor;
      const targetColor =
        window.getComputedStyle(logoElement).color || "rgba(0, 0, 0, 1)";

      setFloatingData({
        sourceRect,
        targetRect,
        scale,
        startColor,
        targetColor,
      });

      // Hide the original text after we've measured it
      requestAnimationFrame(() => setIsTextDetached(true));
      requestAnimationFrame(() => setShowFloatingText(true));

      // Fallback in case the animation never resolves
      hideTimeoutRef.current = window.setTimeout(finishPreloader, 1500);
    } else {
      // If something goes wrong, finish gracefully
      finishPreloader();
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [finishPreloader, isHiding]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const textString = t.preloader?.text1 || "TrauMerch";

  const floatingX =
    floatingData && showFloatingText
      ? floatingData.targetRect.left +
        floatingData.targetRect.width / 2 -
        (floatingData.sourceRect.left + floatingData.sourceRect.width / 2)
      : 0;
  const floatingY =
    floatingData && showFloatingText
      ? floatingData.targetRect.top +
        floatingData.targetRect.height / 2 -
        (floatingData.sourceRect.top + floatingData.sourceRect.height / 2)
      : 0;

  // Don't render if already shown or not on home page
  if (hasShown || !isHomePage) {
    return null;
  }

  return (
    <>
      <motion.div
        className={styles.preloader}
        initial={{ opacity: 1 }}
        animate={{ opacity: isHiding ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ pointerEvents: isHiding ? "none" : "auto" }}
      >
        <div className={styles.content}>
          {/* First text */}
          <div className={styles.text1Wrapper}>
            <motion.div
              ref={text1Ref}
              className={styles.text1}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ visibility: isTextDetached ? "hidden" : "visible" }}
              transition={{
                duration: 0.7,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {textString}
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
            giveaways, our solutions ensure every item strengthens connection
            and brand culture.
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

      {floatingData && showFloatingText && (
        <motion.div
          className={styles.floatingText}
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            color: floatingData.startColor,
          }}
          animate={{
            x: floatingX,
            y: floatingY,
            scale: floatingData.scale,
            color: floatingData.targetColor,
          }}
          transition={{
            duration: 0.9,
            ease: [0.23, 1, 0.32, 1],
          }}
          style={{
            left: floatingData.sourceRect.left,
            top: floatingData.sourceRect.top,
            width: floatingData.sourceRect.width,
            height: floatingData.sourceRect.height,
          }}
          onAnimationComplete={finishPreloader}
        >
          {textString}
        </motion.div>
      )}
    </>
  );
}
