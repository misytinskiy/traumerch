"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  // Rotation state - temporarily unused, will be re-enabled later
  const [_currentWordIndex, _setCurrentWordIndex] = useState(0);
  const [_isAnimating, _setIsAnimating] = useState(false);
  const [_displayWordIndex, _setDisplayWordIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<string>("auto");
  const measureRef = useRef<HTMLSpanElement>(null);

  const rotatingWords = useMemo(() => t.hero.rotatingWords || [], [t]);
  const _rotationInterval = 700; // 0.7 seconds - temporarily unused

  // Measure actual width of all words to set fixed container width
  useEffect(() => {
    if (rotatingWords.length === 0) return;

    // Wait for element to be rendered
    const timeoutId = setTimeout(() => {
      if (!measureRef.current) return;

      const measureWord = (word: string): number => {
        const tempSpan = document.createElement("span");
        tempSpan.style.visibility = "hidden";
        tempSpan.style.position = "absolute";
        tempSpan.style.fontFamily = getComputedStyle(
          measureRef.current!
        ).fontFamily;
        tempSpan.style.fontSize = getComputedStyle(
          measureRef.current!
        ).fontSize;
        tempSpan.style.fontWeight = getComputedStyle(
          measureRef.current!
        ).fontWeight;
        tempSpan.style.fontStyle = getComputedStyle(
          measureRef.current!
        ).fontStyle;
        tempSpan.style.textTransform = getComputedStyle(
          measureRef.current!
        ).textTransform;
        tempSpan.style.letterSpacing = getComputedStyle(
          measureRef.current!
        ).letterSpacing;
        tempSpan.textContent = word;
        document.body.appendChild(tempSpan);
        const width = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        return width;
      };

      const maxWidth = Math.max(
        ...rotatingWords.map((word) => measureWord(word))
      );
      // Add some padding to prevent jumping
      setContainerWidth(`${maxWidth + 20}px`);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [rotatingWords]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth <= 1536);
      setIsSmallScreen(window.innerWidth <= 350);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Rotation temporarily disabled - will be re-enabled later
  // useEffect(() => {
  //   if (rotatingWords.length === 0) return;

  //   const interval = setInterval(() => {
  //     // Start fade out
  //     setIsAnimating(true);
  //     // After fade out, change word and fade in
  //     setTimeout(() => {
  //       const nextIndex = (currentWordIndex + 1) % rotatingWords.length;
  //       setCurrentWordIndex(nextIndex);
  //       setDisplayWordIndex(nextIndex);
  //       setIsAnimating(false);
  //     }, 300); // Half of transition duration
  //   }, rotationInterval);

  //   return () => clearInterval(interval);
  // }, [currentWordIndex, rotatingWords.length, rotationInterval]);

  // Always show first word while rotation is disabled
  const currentWord = rotatingWords.length > 0 ? rotatingWords[0] : "";

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
          ) : (
            <h1 className={styles.title}>
              {t.hero.titlePrefix}{" "}
              <span
                className={styles.wordContainer}
                style={{ width: containerWidth }}
              >
                <span
                  ref={measureRef}
                  className={`${styles.highlight} ${styles.rotatingWord} ${styles.fadeIn}`}
                >
                  {currentWord}
                </span>
              </span>
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
