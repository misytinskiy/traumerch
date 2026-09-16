"use client";

import { useEffect, useState } from "react";
import MediaImage, { getMediaSrc } from "./../Media/MediaImage";
import styles from "./HeroSlider.module.css";

const DEFAULT_SLOTS = ["home.hero.1", "home.hero.2", "home.hero.3"];

interface HeroSliderProps {
  slots?: readonly string[];
  imageAltPrefix?: string;
}

export default function HeroSlider({
  slots = DEFAULT_SLOTS,
  imageAltPrefix = "Hero slide",
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalSlides = slots.length;
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

    const sources = slots
      .map((slot) => getMediaSrc(slot))
      .filter((src): src is string => Boolean(src));

    Promise.all(sources.map(preload)).then(() => {
      if (isMounted) setLoadedCount(slots.length);
    });

    return () => {
      isMounted = false;
    };
  }, [slots]);

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
        {slots.map((slot, index) => (
          <div
            key={slot}
            className={`${styles.slide} ${
              index === currentSlide ? styles.slideActive : ""
            }`}
          >
            <MediaImage
              slot={slot}
              alt={`${imageAltPrefix} ${index + 1}`}
              fill
              className={styles.image}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <div className={styles.dots} aria-label="Hero slider pagination">
        {slots.map((_, index) => (
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
