"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./HeroSlider.module.css";

const DEFAULT_IMAGES = [
  "/heroSliderPhoto/1.JPEG",
  "/heroSliderPhoto/2.JPEG",
  "/heroSliderPhoto/3.JPEG",
];

interface HeroSliderProps {
  images?: readonly string[];
  imageAltPrefix?: string;
}

export default function HeroSlider({
  images = DEFAULT_IMAGES,
  imageAltPrefix = "Hero slide",
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalSlides = images.length;
  const allLoaded = loadedCount >= totalSlides;

  useEffect(() => {
    let isMounted = true;
    setCurrentSlide(0);
    setLoadedCount(0);

    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    Promise.all(images.map(preload)).then(() => {
      if (isMounted) setLoadedCount(images.length);
    });

    return () => {
      isMounted = false;
    };
  }, [images]);

  useEffect(() => {
    if (!allLoaded) return;

    const interval = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % totalSlides);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [allLoaded, totalSlides]);

  const goToSlide = (index: number) => {
    if (!allLoaded || index === currentSlide) return;
    setCurrentSlide(index);
  };

  return (
    <div className={styles.slider}>
      <div className={styles.viewport}>
        {images.map((src, index) => (
          <div
            key={src}
            className={`${styles.slide} ${
              index === currentSlide ? styles.slideActive : ""
            }`}
          >
            <Image
              src={src}
              alt={`${imageAltPrefix} ${index + 1}`}
              fill
              sizes="(max-width: 480px) calc(100vw - 28px), 720px"
              className={styles.image}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <div className={styles.dots} aria-label="Hero slider pagination">
        {images.map((_, index) => (
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
