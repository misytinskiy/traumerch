"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { normalizeFooterColumns } from "../../shared/footer";
import type { FooterLink } from "../../shared/types";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const scrollToSection = (sectionId: string) => {
    if (typeof window === "undefined") return;
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

  const handleFooterNavigation = (link: FooterLink) => {
    const href = link.href;
    if (!href) return;
    if (link.external) {
      if (typeof window !== "undefined") {
        window.open(href, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (href.startsWith("/#")) {
      if (pathname === "/") {
        scrollToSection(href.slice(2));
      } else {
        router.push(href);
      }
      return;
    }
    router.push(href);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.svg"
            alt="TrauMerch Logo"
            width={185.745}
            height={183.51}
            className={styles.logoImage}
          />
        </Link>

        <div className={styles.columns}>
          {normalizeFooterColumns(t.footer.columns).map((column, index) => (
            <div key={index} className={styles.column}>
              <h3 className={styles.columnTitle}>{column.title}</h3>
              <div className={styles.columnLinks}>
              {column.links.map((link, linkIndex) => {
                if (link.href && link.external) {
                  return (
                    <a
                      key={linkIndex}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.columnLink}
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={linkIndex}
                    onClick={() => handleFooterNavigation(link)}
                    className={styles.columnLink}
                  >
                    {link.label}
                  </button>
                );
              })}
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
