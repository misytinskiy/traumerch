"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./ProductSlider.module.css";

const IMAGES = ["/inspiration/1.png", "/inspiration/2.png"];

const LeftArrowIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="36"
      height="36"
      rx="18"
      transform="matrix(-1 0 0 1 36 0)"
      fill="black"
      fillOpacity="0.4"
    />
    <path
      d="M15.36 13.4081L10.768 18.0001M10.768 18.0001L15.36 22.5921M10.768 18.0001H25.2266"
      stroke="white"
      strokeWidth="0.918667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RightArrowIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="36" height="36" rx="18" fill="black" fillOpacity="0.4" />
    <path
      d="M20.64 13.4081L25.232 18.0001M25.232 18.0001L20.64 22.5921M25.232 18.0001H10.7734"
      stroke="white"
      strokeWidth="0.918667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ProductSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [animationTimer, setAnimationTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
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

  useEffect(() => {
    return () => {
      if (animationTimer) clearTimeout(animationTimer);
    };
  }, [animationTimer]);

  const goToSlide = (nextIndex: number) => {
    if (!allLoaded || isAnimating || nextIndex === currentSlide) return;
    setPrevSlide(currentSlide);
    setCurrentSlide(nextIndex);
    setIsAnimating(true);
    if (animationTimer) clearTimeout(animationTimer);
    setAnimationTimer(setTimeout(() => setIsAnimating(false), 320));
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % totalSlides);
  };

  const goPrevSlide = () => {
    goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.sliderStage}>
        <div
          className={`${styles.sliderImage} ${styles.sliderImagePrev} ${
            isAnimating ? styles.fadeOut : ""
          }`}
        >
          <Image
            src={IMAGES[prevSlide]}
            alt="Previous product inspiration"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 600px"
            className={styles.sliderImageContent}
            priority={prevSlide === 0}
          />
        </div>
        <div
          className={`${styles.sliderImage} ${styles.sliderImageCurrent} ${
            isAnimating ? styles.fadeIn : ""
          }`}
        >
          <Image
            src={IMAGES[currentSlide]}
            alt="Product inspiration"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 600px"
            className={styles.sliderImageContent}
            priority={currentSlide === 0}
          />
        </div>
      </div>

      <button
        className={`${styles.sliderNav} ${styles.prev}`}
        onClick={goPrevSlide}
        disabled={!allLoaded}
        aria-label="Previous image"
      >
        <LeftArrowIcon />
      </button>

      <button
        className={`${styles.sliderNav} ${styles.next}`}
        onClick={nextSlide}
        disabled={!allLoaded}
        aria-label="Next image"
      >
        <RightArrowIcon />
      </button>
    </div>
  );
}
