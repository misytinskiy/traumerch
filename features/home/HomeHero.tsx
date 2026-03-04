"use client";

import { useEffect, useRef, useState } from "react";
import Hero from "../../components/Hero/Hero";

export default function HomeHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showUpArrow, setShowUpArrow] = useState(false);

  const smoothScrollTo = (element: HTMLElement, duration: number = 800) => {
    const headerHeight = 80; // Approximate header height
    const targetPosition =
      element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animation = (currentTime: number) => {
      if (!isMountedRef.current) return;
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        rafIdRef.current = requestAnimationFrame(animation);
      } else {
        if (isMountedRef.current) setIsScrolling(false);
      }
    };

    if (isMountedRef.current) setIsScrolling(true);
    rafIdRef.current = requestAnimationFrame(animation);
  };

  const handleScrollToServices = () => {
    if (!isScrolling) {
      if (showUpArrow && heroRef.current) {
        smoothScrollTo(heroRef.current, 1500);
        setShowUpArrow(false);
      } else {
        const promisesElement = document.getElementById("promises");
        if (promisesElement) {
          smoothScrollTo(promisesElement, 1500);
        }
      }
    }
  };

  const handleScrollToGallery = () => {
    if (!isScrolling) {
      if (showUpArrow && heroRef.current) {
        smoothScrollTo(heroRef.current, 1500);
        setShowUpArrow(false);
      } else {
        const galleryElement = document.getElementById("gallery");
        if (galleryElement) {
          smoothScrollTo(galleryElement, 1500);
        }
      }
    }
  };

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const heroElement = heroRef.current;

      const isScrollingUp = currentScrollY < lastScrollY;

      if (heroElement) {
        const heroRect = heroElement.getBoundingClientRect();
        const isHeroVisible =
          heroRect.bottom > 0 && heroRect.top < window.innerHeight;
        const hasScrolledPastHero = currentScrollY > window.innerHeight * 0.8;

        setShowUpArrow(isScrollingUp && hasScrolledPastHero && isHeroVisible);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div ref={heroRef}>
      <Hero
        onScrollClick={handleScrollToServices}
        onScrollButtonClick={handleScrollToGallery}
        showUpArrow={showUpArrow}
        isScrolling={isScrolling}
      />
    </div>
  );
}
