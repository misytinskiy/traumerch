"use client";

import { useRef, useState, useEffect } from "react";
import ResponsiveHeader from "../components/Header/ResponsiveHeader";
import Hero from "../components/Hero/Hero";
import Gallery from "../components/Gallery/Gallery";
import Products from "../components/Products/Products";
import FAQ from "../components/FAQ/FAQ";
import Services from "../components/Services/Services";
import ResponsiveOurPromises from "../components/OurPromises/ResponsiveOurPromises";
import CTA from "../components/CTA/CTA";
import Footer from "../components/Footer/Footer";
import GlassBanner from "../components/GlassBanner/GlassBanner";
import styles from "./page.module.css";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showUpArrow, setShowUpArrow] = useState(false);
  // GlassBanner now handles its own visibility based on scroll

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

  const handleScrollToServices = () => {
    if (!isScrolling) {
      if (showUpArrow && heroRef.current) {
        // Scroll back to hero section
        smoothScrollTo(heroRef.current, 1500);
        setShowUpArrow(false);
      } else {
        // Scroll to services section
        const servicesElement = document.getElementById("services");
        if (servicesElement) {
          smoothScrollTo(servicesElement, 1500);
        }
      }
    }
  };

  // Detect scroll direction and button visibility
  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const heroElement = heroRef.current;

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

      // GlassBanner now handles its own visibility based on scroll direction

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main>
        <div ref={heroRef}>
          <Hero
            onScrollClick={handleScrollToServices}
            showUpArrow={showUpArrow}
            isScrolling={isScrolling}
          />
        </div>

        <div id="gallery">
          <Gallery />
        </div>

        <div id="products">
          <Products />
        </div>

        <div id="services">
          <Services />
        </div>

        <div id="promises">
          <ResponsiveOurPromises />
        </div>

        <div id="faq">
          <FAQ />
        </div>

        <div>
          <CTA />
        </div>
      </main>

      <Footer />

      <GlassBanner />
    </div>
  );
}
