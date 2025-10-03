"use client";

import { useState, useEffect } from "react";
import OurPromisesScroll from "./OurPromisesScroll";
import OurPromisesMobile from "./OurPromisesMobile";

export default function ResponsiveOurPromises() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 480);
      setIsTablet(width <= 744);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (!mounted) {
    return null;
  }

  // Use mobile version for tablets and phones
  if (isMobile || isTablet) {
    return <OurPromisesMobile />;
  }

  // Use desktop version for large screens
  return <OurPromisesScroll />;
}
