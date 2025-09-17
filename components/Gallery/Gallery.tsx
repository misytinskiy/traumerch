"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./Gallery.module.css";

const LeftArrow = () => (
  <svg
    width="54"
    height="54"
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="54"
      height="54"
      rx="27"
      transform="matrix(-1 0 0 1 54 0)"
      fill="black"
    />
    <path
      d="M23.0438 20.1121L16.1558 27.0001M16.1558 27.0001L23.0438 33.8881M16.1558 27.0001H37.8438"
      stroke="white"
      strokeWidth="1.378"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RightArrow = () => (
  <svg
    width="54"
    height="54"
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="54" height="54" rx="27" fill="black" />
    <path
      d="M30.9562 20.1121L37.8442 27.0001M37.8442 27.0001L30.9562 33.8881M37.8442 27.0001H16.1562"
      stroke="white"
      strokeWidth="1.378"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Gallery() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Create array of 10 images using frame.png
  const images = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    src: "/frame.png",
    alt: `Gallery image ${index + 1}`,
  }));

  const itemWidth = 614 + 20; // image width + gap
  const maxIndex = Math.max(0, images.length - 3); // Show 3 images at a time

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <section className={styles.gallery}>
      <div className={styles.header}>
        <SectionTitle>{t.gallery.title}</SectionTitle>

        <div className={styles.navigation}>
          <button
            className={styles.navButton}
            onClick={scrollLeft}
            disabled={currentIndex === 0}
            aria-label="Previous images"
          >
            <LeftArrow />
          </button>
          <button
            className={styles.navButton}
            onClick={scrollRight}
            disabled={currentIndex >= maxIndex}
            aria-label="Next images"
          >
            <RightArrow />
          </button>
        </div>
      </div>

      <div className={styles.imageContainer}>
        <div
          ref={trackRef}
          className={styles.imageTrack}
          style={{
            transform: `translateX(-${currentIndex * itemWidth}px)`,
          }}
        >
          {images.map((image) => (
            <div key={image.id} className={styles.imageItem}>
              <Image
                src={image.src}
                alt={image.alt}
                width={614}
                height={583}
                priority={image.id <= 3}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
