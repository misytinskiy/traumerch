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
  const [showLogo, setShowLogo] = useState(true);
  const [showMenuButton, setShowMenuButton] = useState(true);

  // Check if we're on small desktop for responsive values
  const isSmallDesktop =
    typeof window !== "undefined" && window.innerWidth <= 1536;

  // Determine display labels based on country and language
  const getLanguageLabels = () => {
    return {
      german: country === "AT" ? "AT" : "DE",
      english: "EN",
    };
  };

  const labels = getLanguageLabels();

  // Navigation functions for menu items
  const handleMenuNavigation = (itemId: string) => {
    switch (itemId) {
      case "faq":
        // FAQ - go to FAQ page
        window.location.href = "/faq";
        break;
      case "products":
        // Products - go to catalog page
        window.location.href = "/catalog";
        break;
      case "services":
        // Services - go to solutions page
        window.location.href = "/solutions";
        break;
      case "gallery":
        // Portfolio - scroll to gallery section (main page or navigate with hash)
        if (window.location.pathname === "/") {
          scrollToSection("gallery");
        } else {
          window.location.href = "/#gallery";
        }
        break;
      default:
        break;
    }
    // Menu stays open for easy navigation between sections
  };

  // Scroll functions for sections (used internally)
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
  };

  const handleMenuClick = () => {
    console.log("Menu clicked, current state:", isMenuOpen);
    if (!isMenuOpen) {
      // Opening menu - hide logo and menu button immediately
      setShowLogo(false);
      setShowMenuButton(false);
      setIsMenuOpen(true);
    } else {
      // Closing menu - close menu first, then show elements after delay
      setIsMenuOpen(false);
      setTimeout(() => {
        setShowLogo(true);
        setShowMenuButton(true);
      }, 400); // Wait for menu to fully close (duration: 0.4s)
    }
  };

  // Handle hash navigation on main page
  useEffect(() => {
    if (window.location.pathname === "/" && window.location.hash) {
      const sectionId = window.location.hash.substring(1); // Remove # from hash
      const element = document.getElementById(sectionId);
      if (element) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          const headerHeight = 80;
          const targetPosition =
            element.getBoundingClientRect().top +
            window.pageYOffset -
            headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
          setActiveSection(sectionId);
        }, 100);
      }
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isClickOnMenu = target.closest(".header-menu-container");

      if (isMenuOpen && !isClickOnMenu) {
        console.log("Menu closed by outside click");
        setIsMenuOpen(false);
        setTimeout(() => {
          setShowLogo(true);
          setShowMenuButton(true);
        }, 400); // Wait for menu to fully close
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
  const initialPadding = isSmallDesktop ? "20px 29px" : "20px 60px";
  const scrolledPadding = isSmallDesktop ? "20px 29px" : "20px 40px";
  const initialWidth = "calc(100% - 60px)";
  const scrolledWidth = "calc(100% - 80px)";
  const scrolledTop = 20;
  const scrolledBorderRadius = 24;

  // Initial max-width (wider) and scrolled max-width (current state)
  const initialMaxWidth = isSmallDesktop ? "1200px" : "1740px";
  const scrolledMaxWidth = isSmallDesktop ? "1000px" : "1320px";

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
            {showMenuButton && (
              <motion.div
                className={styles.menu}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                whileHover={{ opacity: 0.7 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
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
                  onClick={() => handleMenuNavigation("faq")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {language === "de" ? "WAS WIR TUN" : "WHAT WE DO"}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "products" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("products")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  {language === "de" ? "UNSER KATALOG" : "OUR CATALOGUE"}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "services" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("services")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  {language === "de" ? "LEISTUNGEN" : "SERVICES"}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "gallery" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("gallery")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  PORTFOLIO
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center - Logo */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 1, filter: "blur(0px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
              transition={{
                duration: 0.3,
                ease: "easeInOut" as const,
              }}
            >
              <Link href="/" className={styles.logo}>
                TRAUMERCH
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Section - Languages and Quote Button */}
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
