"use client";

import {
  motion,
  useScroll,
  useTransform,
  easeOut,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import { useCart } from "../../contexts/CartContext";
import { usePreloader } from "../../contexts/PreloaderContext";
import QuoteButton from "../QuoteButton/QuoteButton";
import styles from "./Header.module.css";

export default function Header() {
  const SCROLL_CLOSE_MIN_DELTA_PX = 8;
  const pathname = usePathname();
  const router = useRouter();
  const { language, country, setLanguage, t } = useLanguage();
  const { openQuote } = useQuoteOverlay();
  const { items, openCart } = useCart();
  const { isEnabled: isPreloaderActive } = usePreloader();
  const hasCartItems = items.length > 0;
  const isHomePage = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [showLogo, setShowLogo] = useState(true);
  const [showMenuButton, setShowMenuButton] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const menuOpenScrollYRef = useRef<number>(0);

  const [isSmallDesktop, setIsSmallDesktop] = useState(false);

  // Determine display labels based on country and language
  const getLanguageLabels = () => {
    return {
      german: country === "AT" ? "AT" : "DE",
      english: "EN",
    };
  };

  const labels = getLanguageLabels();

  useEffect(() => {
    const updateBreakpoint = () => {
      setIsSmallDesktop(window.innerWidth <= 1536);
    };
    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  // Framer Motion scroll animations
  const { scrollY } = useScroll();

  const enableScrollEffects = [
    "/",
    "/portfolio",
    "/solutions",
    "/inspiration",
    "/faq",
    "/policies",
    "/design",
  ].includes(pathname);

  const closeMenu = useCallback(() => {
    setIsHeaderVisible(true);
    setIsMenuOpen(false);
  }, []);

  // Scroll logic with immediate hide/show
  useEffect(() => {
    if (!enableScrollEffects) return;
    let ticking = false;
    let lastScrollY = 0;
    let isHeaderVisibleLocal = true;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollY;

        if (isMenuOpen) {
          if (!isHeaderVisibleLocal) {
            isHeaderVisibleLocal = true;
            setIsHeaderVisible(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
          return;
        }

        // Ignore very small movements to prevent flickering
        if (Math.abs(diff) < 5) {
          ticking = false;
          return;
        }

        // Always show header at the top
        if (currentScrollY <= 100) {
          if (!isHeaderVisibleLocal) {
            isHeaderVisibleLocal = true;
            setIsHeaderVisible(true);
          }
        }
        // Show header if scrolling up (any amount)
        else if (diff < 0) {
          if (!isHeaderVisibleLocal) {
            isHeaderVisibleLocal = true;
            setIsHeaderVisible(true);
          }
        }
        // Hide header immediately when scrolling down past threshold
        else if (diff > 10 && currentScrollY > 200) {
          if (isHeaderVisibleLocal) {
            isHeaderVisibleLocal = false;
            setIsHeaderVisible(false);
          }
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enableScrollEffects, isMenuOpen]);

  // Navigation functions for menu items
  const handleMenuNavigation = (itemId: string) => {
    switch (itemId) {
      case "faq":
        // FAQ - go to FAQ page
        router.push("/faq");
        break;
      case "products":
        // Products - go to catalog page
        router.push("/catalog");
        break;
      case "services":
        // Services - go to solutions page
        router.push("/solutions");
        break;
      case "inspiration":
        router.push("/inspiration");
        break;
      case "gallery":
        // Portfolio - scroll to gallery section (main page or navigate with hash)
        if (pathname === "/") {
          scrollToSection("gallery");
        } else {
          router.push("/#gallery");
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
    if (!isMenuOpen) {
      // Opening menu - hide logo and menu button immediately
      setShowLogo(false);
      setShowMenuButton(false);
      menuOpenScrollYRef.current =
        typeof window !== "undefined" ? window.scrollY : 0;
      setIsMenuOpen(true);
    } else {
      closeMenu();
    }
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    menuOpenScrollYRef.current = window.scrollY;
    let hasClosed = false;

    const handleScrollClose = () => {
      const currentScrollY = window.scrollY;
      const deltaFromOpen = Math.abs(currentScrollY - menuOpenScrollYRef.current);

      if (deltaFromOpen < SCROLL_CLOSE_MIN_DELTA_PX) {
        return;
      }

      if (hasClosed) return;
      hasClosed = true;
      closeMenu();
    };

    window.addEventListener("scroll", handleScrollClose, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollClose);
    };
  }, [
    isMenuOpen,
    closeMenu,
    SCROLL_CLOSE_MIN_DELTA_PX,
  ]);

  // Handle hash navigation on main page
  useEffect(() => {
    if (typeof window === "undefined") return;
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
        closeMenu();
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
  }, [isMenuOpen, closeMenu]);

  // Responsive values based on original CSS
  const initialPadding = isSmallDesktop ? "20px 29px" : "20px 60px";
  const scrolledPadding = isSmallDesktop ? "20px 29px" : "20px 40px";
  const initialWidth = isSmallDesktop
    ? "calc(100% - 291px)"
    : "calc(100% - 180px)";
  const scrolledWidth = isSmallDesktop
    ? "calc(100% - 440px)"
    : "calc(100% - 500px)";
  // scrolledTop is now handled by motion.header animate prop
  const scrolledBorderRadius = 24;

  // Initial max-width (wider) and scrolled max-width (current state)
  // For small desktop, no max-width restriction to allow header to stretch to section paddings
  const initialMaxWidth = isSmallDesktop ? "none" : "1740px";
  const scrolledMaxWidth = isSmallDesktop ? "none" : "1320px";

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
  // top is now animated via motion.header animate prop
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
      animate={{
        top: isHeaderVisible || isMenuOpen ? 20 : -100,
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      style={{
        width,
        borderRadius,
        background,
        backdropFilter,
        boxShadow,
        padding,
        left,
        transform,
        maxWidth,
        borderColor,
        pointerEvents: isHeaderVisible || isMenuOpen ? "auto" : "none",
      }}
    >
      <div className={`${styles.headerContent} header-menu-container`}>
        {/* Left side - Menu button and animated menu items */}
        <div className={styles.leftSide}>
          {/* Menu Button */}
          <div
            className={styles.menu}
            style={{
              opacity: showMenuButton ? 1 : 0,
              transform: showMenuButton
                ? "translateX(0) scale(1)"
                : "translateX(-20px) scale(0.95)",
              pointerEvents: showMenuButton ? "auto" : "none",
              transition: showMenuButton
                ? "none"
                : "opacity 120ms ease-out, transform 120ms ease-out",
              willChange: "opacity, transform",
            }}
            onClick={handleMenuClick}
          >
            {t.header.menu}
          </div>

          {/* Animated Menu Items - slide out from left */}
          <AnimatePresence
            onExitComplete={() => {
              setShowLogo(true);
              setShowMenuButton(true);
            }}
          >
            {isMenuOpen && (
              <motion.div
                className={styles.menuItems}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: -30,
                  transition: {
                    duration: 0.22,
                    ease: "easeInOut",
                  },
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.2,
                }}
              >
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "products" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("products")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {t.header.catalog}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "services" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("services")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  {t.header.services}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "inspiration" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("inspiration")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  {t.header.inspiration}
                </motion.button>
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "faq" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("faq")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  {t.header.faq}
                </motion.button>
                {/* Portfolio hidden
                <motion.button
                  className={`${styles.menuItem} ${
                    activeSection === "gallery" ? styles.active : ""
                  }`}
                  onClick={() => handleMenuNavigation("gallery")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ opacity: 0.7 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  {t.header.portfolio}
                </motion.button>
                */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center - Logo */}
        <motion.div
          initial={false}
          animate={{
            opacity: showLogo ? 1 : 0,
            scale: showLogo ? 1 : 0.98,
            filter: showLogo ? "blur(0px)" : "blur(6px)",
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          style={{ pointerEvents: showLogo ? "auto" : "none" }}
        >
          <Link
            href="/"
            className={styles.logo}
            id="header-logo-anchor"
            style={{
              visibility: isPreloaderActive && isHomePage ? "hidden" : "visible",
              pointerEvents: isPreloaderActive && isHomePage ? "none" : "auto",
            }}
          >
            TRAUMERCH
          </Link>
        </motion.div>

        {/* Right Section - Languages and Quote Button */}
        <motion.div
          className={styles.rightSection}
          layoutId="header-right-section"
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
          }}
          transition={{
            layout: {
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            },
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

          <QuoteButton
            onClick={
              hasCartItems ? openCart : () => openQuote("header_desktop")
            }
            hasCartItems={hasCartItems}
            itemCount={items.length}
            text={t.header.quote}
          />
        </motion.div>
      </div>
    </motion.header>
  );
}
