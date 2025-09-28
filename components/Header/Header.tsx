"use client";

import {
  motion,
  useScroll,
  useTransform,
  easeOut,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./Header.module.css";

export default function Header() {
  const { language, country, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

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

  // Scroll functions for menu items
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const targetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
    // Menu stays open for easy navigation between sections
  };

  const handleMenuClick = () => {
    console.log("Menu clicked, current state:", isMenuOpen);
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickOnMenu = target.closest(".header-menu-container");

      if (isMenuOpen && !isClickOnMenu) {
        console.log("Menu closed by outside click");
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      // Add small delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 200);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMenuOpen]);

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
      <div className={`${styles.headerContent} header-menu-container`}>
        {/* Left side - Menu button and animated menu items */}
        <div className={styles.leftSide}>
          {/* Menu Button */}
          <AnimatePresence>
            {!isMenuOpen && (
              <motion.div
                className={styles.menu}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2,
                }}
                onClick={handleMenuClick}
              >
                {t.header.menu}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Menu Items - slide out from left */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className={styles.menuItems}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.2,
                }}
              >
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "faq" ? styles.active : ""
                  }`}
                  onClick={() => scrollToSection("faq")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {language === "de" ? "WAS WIR TUN" : "WHAT WE DO"}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "products" ? styles.active : ""
                  }`}
                  onClick={() => scrollToSection("products")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  {language === "de" ? "UNSER KATALOG" : "OUR CATALOGUE"}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "services" ? styles.active : ""
                  }`}
                  onClick={() => scrollToSection("services")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  {language === "de" ? "LEISTUNGEN" : "SERVICES"}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "gallery" ? styles.active : ""
                  }`}
                  onClick={() => scrollToSection("gallery")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  PORTFOLIO
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logo - only show when menu is closed */}
        <AnimatePresence>
          {!isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.25,
              }}
            >
              <Link href="/" className={styles.logo}>
                TRAUMERCH
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Section - always visible */}
        <motion.div
          className={styles.rightSection}
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        >
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
        </motion.div>
      </div>
    </motion.header>
  );
}
