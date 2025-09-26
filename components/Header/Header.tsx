"use client";

import { motion, useScroll, useTransform, easeOut } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./Header.module.css";

export default function Header() {
  const { language, country, setLanguage, t } = useLanguage();

  // Check if we're on mobile/tablet for responsive values
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 350;
  const isTablet = typeof window !== "undefined" && window.innerWidth <= 750;

  // Determine display labels based on country and language
  const getLanguageLabels = () => {
    return {
      german: country === "AT" ? "AT" : "DE",
      english: "EN",
    };
  };

  const labels = getLanguageLabels();

  // Framer Motion scroll animations
  const { scrollY } = useScroll();

  // Responsive values based on original CSS
  const initialPadding = isMobile
    ? "15px 20px"
    : isTablet
    ? "20px 40px"
    : "20px 60px";
  const scrolledPadding = isMobile
    ? "15px 20px"
    : isTablet
    ? "20px 30px"
    : "20px 40px";
  const initialWidth = isMobile
    ? "calc(100% - 20px)"
    : isTablet
    ? "calc(100% - 40px)"
    : "calc(100% - 60px)";
  const scrolledWidth = isMobile
    ? "calc(100% - 40px)"
    : isTablet
    ? "calc(100% - 60px)"
    : "calc(100% - 80px)";
  const scrolledTop = isMobile ? 15 : 20;
  const scrolledBorderRadius = isMobile ? 20 : 24;

  // Initial max-width (wider) and scrolled max-width (current state)
  const initialMaxWidth = isMobile ? "600px" : isTablet ? "1400px" : "1620px";
  const scrolledMaxWidth = isMobile ? "600px" : isTablet ? "1200px" : "1320px";

  // More gradual scroll range for smoother transition
  const scrollRange = [0, 200];

  // Header is always centered
  const left = useTransform(scrollY, [0, 0], ["50%", "50%"]);
  const transform = useTransform(
    scrollY,
    [0, 0],
    ["translateX(-50%)", "translateX(-50%)"]
  );

  const width = useTransform(
    scrollY,
    scrollRange,
    [initialWidth, scrolledWidth],
    { ease: easeOut }
  );
  const borderRadius = useTransform(scrollY, scrollRange, [
    scrolledBorderRadius,
    scrolledBorderRadius,
  ]);
  const background = useTransform(
    scrollY,
    scrollRange,
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.15)"], // Start transparent
    { ease: easeOut }
  );
  const backdropFilter = useTransform(scrollY, scrollRange, [
    "blur(20px)",
    "blur(20px)",
  ]);
  const boxShadow = useTransform(
    scrollY,
    scrollRange,
    [
      "none",
      "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
    ],
    { ease: easeOut }
  );
  const top = useTransform(scrollY, scrollRange, [scrolledTop, scrolledTop]);
  const padding = useTransform(
    scrollY,
    scrollRange,
    [initialPadding, scrolledPadding],
    { ease: easeOut }
  );
  const maxWidth = useTransform(
    scrollY,
    scrollRange,
    [initialMaxWidth, scrolledMaxWidth],
    { ease: easeOut }
  );

  // Add border animation for smoother glass effect
  const borderColor = useTransform(
    scrollY,
    scrollRange,
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.2)"],
    { ease: easeOut }
  );

  // Don't render header on mobile and tablet devices
  if (isMobile || isTablet) {
    return null;
  }

  return (
    <motion.header
      className={styles.header}
      style={{
        width,
        borderRadius,
        background,
        backdropFilter,
        boxShadow,
        top,
        padding,
        left,
        transform,
        maxWidth,
        borderColor,
      }}
    >
      <div className={styles.menu}>{t.header.menu}</div>

      <Link href="/" className={styles.logo}>
        TRAUMERCH
      </Link>

      <div className={styles.rightSection}>
        <div className={styles.languageSwitcher}>
          <button
            className={`${styles.languageButton} ${
              language === "de" ? styles.active : ""
            }`}
            onClick={() => setLanguage("de")}
          >
            {labels.german}
          </button>
          <button
            className={`${styles.languageButton} ${
              language === "en" ? styles.active : ""
            }`}
            onClick={() => setLanguage("en")}
          >
            {labels.english}
          </button>
        </div>

        <Button variant="solid" padding="23px 40px">
          {t.header.quote}
        </Button>
      </div>
    </motion.header>
  );
}
