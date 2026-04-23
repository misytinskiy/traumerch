"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import { useCart } from "../../contexts/CartContext";
import { usePreloader } from "../../contexts/PreloaderContext";
import { motion } from "framer-motion";
import Link from "next/link";
import QuoteButton from "../QuoteButton/QuoteButton";
import styles from "./MobileHeader.module.css";

export default function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, country, t } = useLanguage();
  const { openQuote } = useQuoteOverlay();
  const { items, openCart } = useCart();
  const { isEnabled: isPreloaderActive } = usePreloader();
  const hasCartItems = items.length > 0;
  const isHomePage = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Determine display labels based on country and language
  const getLanguageLabels = () => {
    return {
      german: country === "AT" ? "AT" : "DE",
      english: "EN",
    };
  };

  const labels = getLanguageLabels();

  const closeMenu = useCallback((onAfterClose?: () => void) => {
    setIsClosing(true);
    if (closeMenuTimeoutRef.current) {
      clearTimeout(closeMenuTimeoutRef.current);
    }
    closeMenuTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
      closeMenuTimeoutRef.current = null;
      onAfterClose?.();
    }, 300);
  }, []);

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      // Opening menu
      if (closeMenuTimeoutRef.current) {
        clearTimeout(closeMenuTimeoutRef.current);
        closeMenuTimeoutRef.current = null;
      }
      setIsMenuOpen(true);
      setIsClosing(false);
    }
  };

  const handleMenuNavigation = (itemId: string) => {
    switch (itemId) {
      case "faq":
        router.push("/faq");
        break;
      case "products":
        router.push("/catalog");
        break;
      case "services":
        router.push("/solutions");
        break;
      case "inspiration":
        router.push("/inspiration");
        break;
      case "gallery":
        if (pathname === "/") {
          const element = document.getElementById("gallery");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        } else {
          router.push("/#gallery");
        }
        break;
      case "policy":
        router.push("/policies");
        break;
      default:
        break;
    }
    closeMenu();
  };

  const handleMenuQuoteAction = () => {
    closeMenu(() => {
      if (hasCartItems) {
        openCart();
      } else {
        openQuote("mobile_menu");
      }
    });
  };

  useEffect(() => {
    if (!isMenuOpen || isClosing) return;

    let hasClosed = false;

    const handleScrollClose = () => {
      if (hasClosed) return;
      hasClosed = true;
      closeMenu();
    };

    window.addEventListener("scroll", handleScrollClose, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollClose);
    };
  }, [isMenuOpen, isClosing, closeMenu]);

  useEffect(() => {
    return () => {
      if (closeMenuTimeoutRef.current) {
        clearTimeout(closeMenuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <header className={styles.mobileHeader}>
        <div className={styles.headerContent}>
          {/* Left side - Logo */}
          <Link
            href="/"
            className={styles.logo}
            id="header-logo-anchor"
            style={{
              visibility:
                isPreloaderActive && isHomePage ? "hidden" : "visible",
              pointerEvents: isPreloaderActive && isHomePage ? "none" : "auto",
            }}
          >
            TRAUMERCH
          </Link>

          {/* Right side - Languages and Burger */}
          <motion.div
            className={styles.rightSection}
            layoutId="mobile-header-right-section"
            transition={{
              layout: {
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              },
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
                hasCartItems ? openCart : () => openQuote("header_mobile")
              }
              hasCartItems={hasCartItems}
              itemCount={items.length}
              text={t.header.quote}
              isMobile={true}
            />

            <button
              className={`${styles.burger} ${isMenuOpen ? styles.open : ""}`}
              onClick={toggleMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </motion.div>
        </div>
      </header>

      {/* Fullscreen Menu Overlay */}
      {isMenuOpen && (
        <div
          className={`${styles.menuOverlay} ${
            isClosing ? styles.closing : styles.open
          }`}
        >
          <div className={styles.menuContent}>
            {/* Header with Logo and Close Button */}
            <div className={styles.menuHeader}>
              <Link
                href="/"
                className={styles.menuLogo}
                onClick={() => closeMenu()}
              >
                TRAUMERCH
              </Link>
              <button
                className={`${styles.closeButton} ${
                  isMenuOpen ? styles.open : ""
                }`}
                onClick={toggleMenu}
              >
                <span></span>
                <span></span>
              </button>
            </div>

            {/* Main Menu Items */}
            <nav className={styles.menuNav}>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("products")}
              >
                {t.header.catalog}
              </button>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("services")}
              >
                {t.header.servicesLong}
              </button>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("inspiration")}
              >
                {t.header.inspiration}
              </button>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("faq")}
              >
                {t.header.faq}
              </button>

              {/* Portfolio hidden
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("gallery")}
              >
                {t.header.portfolio}
              </button>
              */}
            </nav>

            {/* Secondary Menu Items */}
            <nav className={styles.secondaryMenu}>
              <button
                className={styles.secondaryMenuItem}
                onClick={() => handleMenuNavigation("faq")}
              >
                {t.header.faq}
              </button>
              <button
                className={styles.secondaryMenuItem}
                onClick={() => handleMenuNavigation("policy")}
              >
                {t.header.policy}
              </button>
            </nav>

            {/* Contact Button */}
            <div className={styles.menuFooter}>
              <QuoteButton
                onClick={handleMenuQuoteAction}
                hasCartItems={hasCartItems}
                itemCount={items.length}
                text={hasCartItems ? t.header.cart : t.header.contact}
                className={styles.menuQuoteButton}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
