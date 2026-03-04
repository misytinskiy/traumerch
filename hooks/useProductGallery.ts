"use client";

import { useRef, useState, useEffect } from "react";
import type { PhotoVariants } from "../components/ProductDetails/types";

export default function useProductGallery({
  photos,
}: {
  photos: PhotoVariants[];
}) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (photos.length > 0) {
      setSelectedPhotoIndex(0);
    }
  }, [photos.length]);

  const handleThumbnailClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleDotClick = (index: number) => {
    setSelectedPhotoIndex(index);
    const slider = sliderRef.current;
    const slide = slider?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const handleSliderScroll = () => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const slider = sliderRef.current;
      if (!slider || slider.children.length === 0) return;
      const firstSlide = slider.children[0] as HTMLElement;
      const slideWidth = firstSlide.getBoundingClientRect().width;
      const gap = parseFloat(
        getComputedStyle(slider).columnGap || getComputedStyle(slider).gap || "0"
      );
      const step = slideWidth + gap;
      if (step <= 0) return;
      const nextIndex = Math.round(slider.scrollLeft / step);
      const clamped = Math.max(0, Math.min(nextIndex, slider.children.length - 1));
      if (clamped !== selectedPhotoIndex) {
        setSelectedPhotoIndex(clamped);
      }
    });
  };

  return {
    selectedPhotoIndex,
    sliderRef,
    handleThumbnailClick,
    handleDotClick,
    handleSliderScroll,
  };
}
