"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
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
  const { language, setLanguage, country, t } = useLanguage();
  const { openQuote } = useQuoteOverlay();
  const { items, openCart } = useCart();
  const { isEnabled: isPreloaderActive } = usePreloader();
  const hasCartItems = items.length > 0;
  const isHomePage = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Determine display labels based on country and language
  const getLanguageLabels = () => {
    return {
      german: country === "AT" ? "AT" : "DE",
      english: "EN",
    };
  };

  const labels = getLanguageLabels();

  const toggleMenu = () => {
    if (isMenuOpen) {
      // Closing menu - start closing animation
      setIsClosing(true);
      setTimeout(() => {
        setIsMenuOpen(false);
        setIsClosing(false);
      }, 300); // Match animation duration
    } else {
      // Opening menu
      setIsMenuOpen(true);
      setIsClosing(false);
    }
  };

  const handleMenuNavigation = (itemId: string) => {
    switch (itemId) {
      case "faq":
        window.location.href = "/faq";
        break;
      case "products":
        window.location.href = "/catalog";
        break;
      case "services":
        window.location.href = "/solutions";
        break;
      case "gallery":
        if (window.location.pathname === "/") {
          const element = document.getElementById("gallery");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        } else {
          window.location.href = "/#gallery";
        }
        break;
      case "policy":
        window.location.href = "/policies";
        break;
      default:
        break;
    }
    // Close menu with animation
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleMenuQuoteAction = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
      if (hasCartItems) {
        openCart();
      } else {
        openQuote();
      }
    }, 300);
  };

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
              onClick={hasCartItems ? openCart : openQuote}
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
                onClick={() => setIsMenuOpen(false)}
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
                {language === "de" ? "UNSER KATALOG" : "OUR CATALOGUE"}
              </button>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("services")}
              >
                {language === "de" ? "DIENSTLEISTUNGEN" : "SERVICES"}
              </button>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("faq")}
              >
                FAQ
              </button>
              <button
                className={styles.menuItem}
                onClick={() => handleMenuNavigation("gallery")}
              >
                PORTFOLIO
              </button>
            </nav>

            {/* Secondary Menu Items */}
            <nav className={styles.secondaryMenu}>
              <button
                className={styles.secondaryMenuItem}
                onClick={() => handleMenuNavigation("faq")}
              >
                FAQ
              </button>
              <button
                className={styles.secondaryMenuItem}
                onClick={() => handleMenuNavigation("policy")}
              >
                POLICY
              </button>
            </nav>

            {/* Contact Button */}
            <div className={styles.menuFooter}>
              <QuoteButton
                onClick={handleMenuQuoteAction}
                hasCartItems={hasCartItems}
                itemCount={items.length}
                text={hasCartItems ? "CART" : "CONTACT US"}
                className={styles.menuQuoteButton}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
