"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import MobileHeader from "./MobileHeader";

export default function ResponsiveHeader() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isMobile ? <MobileHeader /> : <Header />;
}
