"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
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
        <div
          key={index}
          className={`${styles.serviceCard} ${
            index % 2 === 1 ? styles.reverse : ""
          }`}
        >
          <div className={styles.textContent}>
            <p className={styles.badge}>{service.badge}</p>
            <div className={styles.title}>
              <SectionTitle maxWidth={610}>{service.title}</SectionTitle>
            </div>
            <div className={styles.desktopDescription}>
              <p className={styles.description}>{service.description}</p>
              <Button
                variant="solid"
                padding="31px 40px"
                padding768="30px 72px"
                arrow="white"
              >
                SEE MORE
              </Button>
            </div>
          </div>

          <div className={styles.imageContent}>
            <div className={styles.serviceImage}>
              <img
                src={`/services/${index + 1}.png`}
                alt={service.title}
                className={styles.serviceImageTag}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
            <div className={styles.mobileDescription}>
              <p className={styles.description}>{service.description}</p>
              <Button
                variant="solid"
                padding="31px 40px"
                padding768="42px 114px"
                padding350="26px 63px"
                arrow="white"
              >
                SEE MORE
              </Button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
