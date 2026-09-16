"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import MediaImage from "../Media/MediaImage";
import ServiceTitle from "../ServiceTitle/ServiceTitle";
import styles from "./Services.module.css";

interface ServicesProps {
  showAll?: boolean;
}

export default function Services({ showAll = false }: ServicesProps) {
  const { t } = useLanguage();

  // Show either first 3 services or all 5 services
  const servicesToShow = showAll
    ? t.services.items
    : t.services.items.slice(0, 3);

  return (
    <section className={styles.services}>
      {servicesToShow.map((service, index) => (
        <article
          key={index}
          className={`${styles.serviceCard} ${
            index % 2 === 1 ? styles.reverse : ""
          }`}
        >
          <div className={styles.textContent}>
            <p className={styles.badge}>{service.badge}</p>
            <div className={styles.title}>
              <ServiceTitle maxWidth={610}>{service.title}</ServiceTitle>
            </div>
            <div className={styles.desktopDescription}>
              <p className={styles.description}>{service.description}</p>
        
            </div>
          </div>

          <div className={styles.imageContent}>
            <div className={styles.serviceImage}>
              <MediaImage
                slot={`services.${index + 1}.main`}
                alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                fill
                className={styles.serviceImageImg}
              />
            </div>
            <div className={styles.mobileDescription}>
              <p className={styles.description}>{service.description}</p>
      
            </div>
          </div>
          <div className={styles.mobileMosaic}>
            <div className={styles.mobileTextCard}>
              <p className={styles.mobileText}>{service.description}</p>
              <span className={styles.mobileTextArrow} aria-hidden>
                <svg viewBox="0 0 54 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2 12H48"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M38 3L48 12L38 21"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className={`${styles.mobileMosaicImage} ${styles.mobileMosaicImageTop}`}>
              <MediaImage
                slot={`services.${index + 1}.mobile.1`}
                alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                fill
                className={styles.mobileMosaicImageImg}
              />
            </div>
            <div className={`${styles.mobileMosaicImage} ${styles.mobileMosaicImageMiddle}`}>
              <MediaImage
                slot={`services.${index + 1}.mobile.2`}
                alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                fill
                className={styles.mobileMosaicImageImg}
              />
            </div>
            <div className={styles.mobileMosaicWide}>
              <MediaImage
                slot={`services.${index + 1}.mobile.3`}
                alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                fill
                className={styles.mobileMosaicImageImg}
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
