"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./Header.module.css";

export default function Header() {
  const { language, country, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  // Determine display labels based on country and language
  const getLanguageLabels = () => {
    return {
      german: country === "AT" ? "AT" : "DE",
      english: "EN",
    };
  };

  const labels = getLanguageLabels();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.menu}>{t.header.menu}</div>

      <Link href="/" className={styles.logo}>
        TRAUMERCH
      </Link>

      <div className={styles.rightSection}>
        <div className={styles.languageSwitcher}>
          <button
            className={`${styles.languageButton} ${
              language === "de" ? styles.active : ""
            }`}
            onClick={() => setLanguage("de")}
          >
            {labels.german}
          </button>
          <button
            className={`${styles.languageButton} ${
              language === "en" ? styles.active : ""
            }`}
            onClick={() => setLanguage("en")}
          >
            {labels.english}
          </button>
        </div>

        <Button variant="solid" padding="23px 40px">
          {t.header.quote}
        </Button>
      </div>
    </header>
  );
}
