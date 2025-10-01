"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "../Button/Button";
import styles from "./GlassBanner.module.css";

export default function GlassBanner() {
  const [mounted, setMounted] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll logic for banner visibility (opposite of header)
  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;
    let isBannerVisible = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollY;

        // Ignore very small movements to prevent flickering
        if (Math.abs(diff) < 5) {
          ticking = false;
          return;
        }

        // Hide banner at the top
        if (currentScrollY <= 100) {
          if (isBannerVisible) {
            isBannerVisible = false;
            setIsBannerVisible(false);
          }
        }
        // Hide banner if scrolling up
        else if (diff < 0) {
          if (isBannerVisible) {
            isBannerVisible = false;
            setIsBannerVisible(false);
          }
        }
        // Show banner when scrolling down past threshold
        else if (diff > 10 && currentScrollY > 200) {
          if (!isBannerVisible) {
            isBannerVisible = true;
            setIsBannerVisible(true);
          }
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  // Check if we're on mobile - hide glass banner on mobile devices
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 744;

  // Don't render glass banner on mobile devices
  if (isMobile) {
    return null;
  }

  return (
    <motion.div
      className={styles.glassBanner}
      animate={{
        bottom: isBannerVisible ? 40 : -120,
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      style={{
        pointerEvents: isBannerVisible ? "auto" : "none",
      }}
    >
      <div className={styles.bannerContent}>
        <h2 className={styles.bannerText}>
          Ready to create merchandise for your brand?
        </h2>

        <div className={styles.bannerButton}>
          <Button variant="transparent" padding="20px 32px">
            REQUEST QUOTE NOW
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
