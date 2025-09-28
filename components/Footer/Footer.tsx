"use client";

import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useLanguage();

  // Navigation functions for footer links
  const handleFooterNavigation = (linkText: string) => {
    switch (linkText) {
      case "Products":
        window.location.href = "/catalog";
        break;
      case "Services":
        window.location.href = "/solutions";
        break;
      case "Portfolio":
        if (window.location.pathname === "/") {
          scrollToSection("gallery");
        } else {
          window.location.href = "/#gallery";
        }
        break;
      case "FAQ":
        if (window.location.pathname === "/") {
          scrollToSection("faq");
        } else {
          window.location.href = "/#faq";
        }
        break;
      default:
        break;
    }
  };

  // Scroll functions for sections (used internally)
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const targetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <Link href="/" className={styles.logo}>
          TRAUMERCH
        </Link>

        <div className={styles.columns}>
          {t.footer.columns.map((column, index) => (
            <div key={index} className={styles.column}>
              <h3 className={styles.columnTitle}>{column.title}</h3>
              <div className={styles.columnLinks}>
                {column.links.map((link, linkIndex) => (
                  <button
                    key={linkIndex}
                    onClick={() => handleFooterNavigation(link)}
                    className={styles.columnLink}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottomRow}>
        <p className={styles.copyright}>{t.footer.copyright}</p>
        <p className={styles.allRights}>{t.footer.allRights}</p>
      </div>
    </footer>
  );
}
