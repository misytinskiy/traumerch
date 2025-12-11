"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./Hero.module.css";

interface HeroProps {
  onScrollClick?: () => void;
  onScrollButtonClick?: () => void;
  showUpArrow?: boolean;
  isScrolling?: boolean;
}

export default function Hero({
  onScrollClick,
  onScrollButtonClick,
  showUpArrow = false,
  isScrolling = false,
}: HeroProps) {
  const { t } = useLanguage();
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth <= 1536);
      setIsSmallScreen(window.innerWidth <= 350);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          {isSmallScreen ? (
            <h1 className={styles.title}>
              {t.hero.titleLine1Small}
              <br />
              {t.hero.titleLine2Small}
              <br />
              {t.hero.titleLine3Small}
              <br />
              {t.hero.titleLine4Small}
              <br />
              {t.hero.titleLine5Small}
              <br />
              {t.hero.titleLine6Small}
              <br />
              {t.hero.titleLine7Small}
            </h1>
          ) : isLargeScreen ? (
            <h1 className={styles.title}>
              {t.hero.titleLine1}
              <br />
              {t.hero.titleLine2}
              <br />
              {t.hero.titleLine3}
              <br />
              {t.hero.titleLine4}{" "}
              <span className={styles.highlight}>{t.hero.titleHighlight}</span>
            </h1>
          ) : (
            <h1 className={styles.title}>
              {t.hero.title}{" "}
              <span className={styles.highlight}>{t.hero.titleHighlight}</span>
            </h1>
          )}

          <Button
            variant="solid"
            padding={isLargeScreen ? "31px 53px" : "31px 41px"}
            padding480="24px 48px"
            arrow="white"
            className={styles.ctaButton}
            onClick={onScrollClick}
            fontSize1920="20px 48px"
            padding1536="20px 48px"
          >
            {t.hero.cta}
          </Button>
        </div>
      </div>
      <button
        className={`${styles.scrollButton} ${
          showUpArrow ? styles.rotated : ""
        } ${isScrolling ? styles.scrolling : ""}`}
        onClick={onScrollButtonClick || onScrollClick}
        aria-label="Scroll to next section"
        disabled={isScrolling}
      >
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g opacity="0.3">
            <rect
              x="0.5"
              y="0.5"
              width="49"
              height="49"
              rx="24.5"
              stroke="black"
            />
            <path
              d="M18.6404 21.4646C18.828 21.2771 19.0823 21.1718 19.3474 21.1718C19.6126 21.1718 19.8669 21.2771 20.0544 21.4646L25.0044 26.4146L29.9544 21.4646C30.143 21.2824 30.3956 21.1816 30.6578 21.1839C30.92 21.1862 31.1709 21.2914 31.3563 21.4768C31.5417 21.6622 31.6468 21.913 31.6491 22.1752C31.6514 22.4374 31.5506 22.69 31.3684 22.8786L25.7114 28.5356C25.5239 28.7231 25.2696 28.8284 25.0044 28.8284C24.7393 28.8284 24.485 28.7231 24.2974 28.5356L18.6404 22.8786C18.453 22.6911 18.3477 22.4367 18.3477 22.1716C18.3477 21.9064 18.453 21.6521 18.6404 21.4646Z"
              fill="black"
            />
          </g>
        </svg>
      </button>
    </section>
  );
}
