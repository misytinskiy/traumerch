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

  return (
    <section className={styles.services}>
      {servicesToShow.map((service, index) => (
        <div
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
        </div>
      ))}
    </section>
  );
}
