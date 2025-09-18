"use client";

import { useState } from "react";
import styles from "./ProductSlider.module.css";

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
  const totalSlides = 5; // Number of slider images

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.sliderImage} />

      <button
        className={`${styles.sliderNav} ${styles.prev}`}
        onClick={prevSlide}
        aria-label="Previous image"
      >
        <LeftArrowIcon />
      </button>

      <button
        className={`${styles.sliderNav} ${styles.next}`}
        onClick={nextSlide}
        aria-label="Next image"
      >
        <RightArrowIcon />
      </button>
    </div>
  );
}
