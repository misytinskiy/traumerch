"use client";

import { useRef, useState, useEffect } from "react";
import Header from "../../components/Header/Header";
import Services from "../../components/Services/Services";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./solutions.module.css";

export default function Solutions() {
  const { t } = useLanguage();
  const servicesRef = useRef<HTMLElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 350);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleScrollToServices = () => {
    if (servicesRef.current) {
      servicesRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main>
        {/* Hero-like section */}
        <section className={styles.hero}>
          {isSmallScreen ? (
            <h1 className={styles.title}>
              {t.solutions.hero.titleLine1}
              <br />
              {t.solutions.hero.titleLine2}
              <br />
              {t.solutions.hero.titleLine3}
            </h1>
          ) : (
            <h1 className={styles.title}>{t.solutions.hero.title}</h1>
          )}

          <button
            className={styles.scrollButton}
            onClick={handleScrollToServices}
            aria-label="Scroll to services section"
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g opacity="0.3">
                <rect
                  x="0.5"
                  y="0.5"
                  width="49"
                  height="49"
                  rx="24.5"
                  stroke="black"
                />
                <path
                  d="M18.6424 21.4643C18.8299 21.2769 19.0842 21.1716 19.3494 21.1716C19.6146 21.1716 19.8689 21.2769 20.0564 21.4643L25.0064 26.4143L29.9564 21.4643C30.145 21.2822 30.3976 21.1814 30.6598 21.1837C30.922 21.1859 31.1728 21.2911 31.3582 21.4765C31.5436 21.6619 31.6488 21.9127 31.6511 22.1749C31.6533 22.4371 31.5526 22.6897 31.3704 22.8783L25.7134 28.5353C25.5259 28.7228 25.2716 28.8281 25.0064 28.8281C24.7412 28.8281 24.4869 28.7228 24.2994 28.5353L18.6424 22.8783C18.4549 22.6908 18.3496 22.4365 18.3496 22.1713C18.3496 21.9062 18.4549 21.6519 18.6424 21.4643Z"
                  fill="black"
                />
              </g>
            </svg>
          </button>
        </section>

        {/* Extended Services section with all 5 services */}
        <section ref={servicesRef}>
          <Services showAll={true} />
        </section>

        {/* CTA section */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
