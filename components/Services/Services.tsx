"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import Image from "next/image";
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

  const getServiceImageSrc = (rawImage: string | undefined, index: number) => {
    const fallback = `/services/${index + 1}.png`;
    if (!rawImage) return fallback;

    if (rawImage.startsWith("/services/") && rawImage.endsWith(".jpg")) {
      return rawImage.replace(/\.jpg$/i, ".png");
    }

    return rawImage;
  };

  const getServiceMobileImages = (index: number) => {
    const imageSets = [
      ["/services/1/1.jpg", "/services/1/2.jpg", "/services/1/3.png"],
      ["/services/2/1.jpg", "/services/2/2.jpg", "/services/2/3.png"],
      ["/services/3/1.jpg", "/services/3/2.png", "/services/3/3.PNG"],
      ["/services/4/1.png", "/services/4/2.png", "/services/4/3.png"],
      ["/services/5/1.png", "/services/5/2.png", "/services/5/3.png"],
    ];

    return imageSets[index] ?? [];
  };

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
              <Image
                src={getServiceImageSrc(service.image, index)}
                alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                fill
                sizes="(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 40vw"
                quality={100}
                unoptimized
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
            {getServiceMobileImages(index)[0] ? (
              <div className={`${styles.mobileMosaicImage} ${styles.mobileMosaicImageTop}`}>
                <Image
                  src={getServiceMobileImages(index)[0]}
                  alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                  fill
                  sizes="(max-width: 480px) 58vw, 220px"
                  className={styles.mobileMosaicImageImg}
                />
              </div>
            ) : null}
            {getServiceMobileImages(index)[1] ? (
              <div className={`${styles.mobileMosaicImage} ${styles.mobileMosaicImageMiddle}`}>
                <Image
                  src={getServiceMobileImages(index)[1]}
                  alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                  fill
                  sizes="(max-width: 480px) 58vw, 220px"
                  className={styles.mobileMosaicImageImg}
                />
              </div>
            ) : null}
            {getServiceMobileImages(index)[2] ? (
              <div className={styles.mobileMosaicWide}>
                <Image
                  src={getServiceMobileImages(index)[2]}
                  alt={service.imageAlt ?? service.title ?? service.badge ?? ""}
                  fill
                  sizes="(max-width: 480px) calc(100vw - 20px), 420px"
                  className={styles.mobileMosaicImageImg}
                />
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
