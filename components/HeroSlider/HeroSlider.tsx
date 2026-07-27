"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./HeroSlider.module.css";

const IMAGES = [
  "/heroSliderPhoto/1.JPEG",
  "/heroSliderPhoto/2.JPEG",
  "/heroSliderPhoto/3.JPEG",
];

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 18 28" aria-hidden>
      <path
        d={
          direction === "left"
            ? "M15 3 4 14l11 11"
            : "M3 3l11 11L3 25"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalSlides = IMAGES.length;
  const allLoaded = loadedCount >= totalSlides;

  useEffect(() => {
    let isMounted = true;

    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    Promise.all(IMAGES.map(preload)).then(() => {
      if (isMounted) setLoadedCount(IMAGES.length);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const goToSlide = (index: number) => {
    if (!allLoaded || index === currentSlide) return;
    setCurrentSlide(index);
  };

  const goPrev = () => {
    if (!allLoaded) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goNext = () => {
    if (!allLoaded) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  return (
    <div className={styles.slider}>
      <div className={styles.viewport}>
        {IMAGES.map((src, index) => (
          <div
            key={src}
            className={`${styles.slide} ${
              index === currentSlide ? styles.slideActive : ""
            }`}
          >
            <Image
              src={src}
              alt={`Hero slide ${index + 1}`}
              fill
              sizes="(max-width: 480px) calc(100vw - 28px), 720px"
              className={styles.image}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={goPrev}
        disabled={!allLoaded}
        aria-label="Previous slide"
      >
        <ArrowIcon direction="left" />
      </button>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={goNext}
        disabled={!allLoaded}
        aria-label="Next slide"
      >
        <ArrowIcon direction="right" />
      </button>

      <div className={styles.dots} aria-label="Hero slider pagination">
        {IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.dot} ${
              index === currentSlide ? styles.dotActive : ""
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-pressed={index === currentSlide}
          />
        ))}
      </div>
    </div>
  );
}
