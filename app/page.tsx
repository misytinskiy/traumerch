"use client";

import { useRef, useState, useEffect } from "react";
import Header from "../components/Header/Header";
import Hero from "../components/Hero/Hero";
import Gallery from "../components/Gallery/Gallery";
import Products from "../components/Products/Products";
import Promise from "../components/Promise/Promise";
import FAQ from "../components/FAQ/FAQ";
import Services from "../components/Services/Services";
import CTA from "../components/CTA/CTA";
import Footer from "../components/Footer/Footer";
import GlassBanner from "../components/GlassBanner/GlassBanner";
import styles from "./page.module.css";

export default function Home() {
  const nextSectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showGlassBanner, setShowGlassBanner] = useState(false);

  // Custom smooth scroll function
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
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        setIsScrolling(false);
      }
    };

    setIsScrolling(true);
    requestAnimationFrame(animation);
  };

  const handleScrollToNext = () => {
    if (!isScrolling) {
      if (showUpArrow && heroRef.current) {
        // Scroll back to hero section
        smoothScrollTo(heroRef.current, 1500);
        setShowUpArrow(false);
      } else if (nextSectionRef.current) {
        // Scroll to next section
        smoothScrollTo(nextSectionRef.current, 1500);
      }
    }
  };

  // Detect scroll direction and button visibility
  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const heroElement = heroRef.current;
      const productsElement = productsRef.current;
      const ctaElement = ctaRef.current;

      // Track scroll direction for arrow logic
      const isScrollingUp = currentScrollY < lastScrollY;

      // Check if we're scrolling back to hero and button is visible
      if (heroElement) {
        const heroRect = heroElement.getBoundingClientRect();
        const isHeroVisible =
          heroRect.bottom > 0 && heroRect.top < window.innerHeight;
        const hasScrolledPastHero = currentScrollY > window.innerHeight * 0.8;

        // Show up arrow only when scrolling up AND we've scrolled past hero AND hero is becoming visible
        setShowUpArrow(isScrollingUp && hasScrolledPastHero && isHeroVisible);
      }

      // Glass Banner logic: show from Products section until CTA section
      if (productsElement && ctaElement) {
        const productsRect = productsElement.getBoundingClientRect();
        const ctaRect = ctaElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Show banner when Products section is 50% visible
        const isProductsVisible = productsRect.top < windowHeight * 0.5;

        // Hide banner when CTA section is 30% visible (before it fully appears)
        const isCTAVisible = ctaRect.top < windowHeight * 0.7;

        // Show banner only when we're past Products but before CTA
        setShowGlassBanner(isProductsVisible && !isCTAVisible);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.page}>
      <Header />
      <main>
        <div ref={heroRef}>
          <Hero
            onScrollClick={handleScrollToNext}
            showUpArrow={showUpArrow}
            isScrolling={isScrolling}
          />
        </div>

        <div ref={nextSectionRef}>
          <Gallery />
        </div>

        <div ref={productsRef}>
          <Products />
        </div>

        <Services />

        <Promise />

        <FAQ />

        <div ref={ctaRef}>
          <CTA />
        </div>
      </main>

      <Footer />

      {/* Glass Banner */}
      <GlassBanner isVisible={showGlassBanner} />
    </div>
  );
}
