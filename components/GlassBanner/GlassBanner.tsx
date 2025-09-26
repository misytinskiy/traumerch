"use client";

import { useEffect, useState } from "react";
import Button from "../Button/Button";
import styles from "./GlassBanner.module.css";

interface GlassBannerProps {
  isVisible: boolean;
}

export default function GlassBanner({ isVisible }: GlassBannerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Check if we're on mobile/tablet - hide glass banner on these devices
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 744;
  const isTablet = typeof window !== "undefined" && window.innerWidth <= 1536;

  // Don't render glass banner on mobile and tablet devices
  if (isMobile || isTablet) {
    return null;
  }

  return (
    <div className={`${styles.glassBanner} ${isVisible ? styles.visible : ""}`}>
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
    </div>
  );
}
