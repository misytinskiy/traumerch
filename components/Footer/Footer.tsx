"use client";

import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useLanguage();

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
                  <a key={linkIndex} href="#" className={styles.columnLink}>
                    {link}
                  </a>
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
