"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Services from "../../components/Services/Services";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./solutions.module.css";

export default function SolutionsPage() {
  const { t } = useLanguage();
  const servicesRef = useRef<HTMLElement>(null);
  const servicesItems = t.services.items;
  const mobileCards = t.solutions.mobileCards as Array<{
    title: string;
    description: string;
    image: string;
    imageAlt?: string;
  }>;
  const trustedCompanies = [
    "Google",
    "pwc",
    "Red Bull",
    "BOSS",
    "LBS",
    "STRABAG",
    "VIE",
    "PORSCHE",
  ];

  const getServiceImageSrc = (rawImage: string | undefined, index: number) => {
    const fallback = `/services/${index + 1}.png`;
    if (!rawImage) return fallback;

    if (rawImage.startsWith("/services/") && rawImage.endsWith(".jpg")) {
      return rawImage.replace(/\.jpg$/i, ".png");
    }

    return rawImage;
  };

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
      <main>
        <section className={styles.hero}>
          <h1 className={styles.title}>{t.solutions.hero.title}</h1>

        <button
          className={styles.scrollButton}
          onClick={handleScrollToServices}
          aria-label={t.solutions.scrollAria ?? "Scroll to services section"}
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

        <section className={styles.mobileLayout}>
          <div className={styles.mobileIntro}>
            <p className={styles.mobileLabel}>{t.solutions.hero.titleLine1}</p>
            <h1 className={styles.mobileTitle}>
              {t.solutions.hero.mobileTitleLine1}
              <br />
              {t.solutions.hero.mobileTitleLine2}
              <br />
              {t.solutions.hero.mobileTitleLine3}
            </h1>
          </div>

          <div className={styles.mobileMedia}>
            <Image
              src="/services/placeholder.png"
              alt=""
              fill
              sizes="(max-width: 480px) calc(100vw - 20px), 640px"
              className={styles.mobileMediaImage}
            />
          </div>

          <div className={styles.mobileCardsSection}>
            <p className={styles.mobileCardsLabel}>SOLUTIONS FOR EVERY PURPOSE</p>
            <div className={styles.mobileCardsScroller}>
              {mobileCards.map((card, index: number) => (
                <Link key={card.title} href="/catalog" className={styles.mobileCard}>
                  <div className={styles.mobileCardImageWrap}>
                    <Image
                      src={card.image}
                      alt={card.imageAlt ?? card.title}
                      fill
                      sizes="180px"
                      className={styles.mobileCardImage}
                    />
                  </div>
                  <div className={styles.mobileCardBody}>
                    <div className={styles.mobileCardHeading}>
                      <h3 className={styles.mobileCardTitle}>{card.title}</h3>
                      <span className={styles.mobileCardArrow} aria-hidden>
                        <svg viewBox="0 0 44 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 9H38" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <path d="M30 1L38 9L30 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                    <p className={styles.mobileCardDescription}>{card.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.mobileTrustedBlock}>
            <p className={styles.mobileTrustedTitle}>{t.hero.trustedTitle}</p>
            <div className={styles.mobileTrustedGrid}>
              {trustedCompanies.map((company) => (
                <span key={company} className={styles.mobileTrustedLogo}>
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section ref={servicesRef} className={styles.desktopServices}>
          <Services showAll={true} />
        </section>

      </main>
    </div>
  );
}
