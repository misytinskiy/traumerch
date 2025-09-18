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
            <p className={styles.description}>{service.description}</p>
            <Button variant="transparent" padding="31px 40px">
              {service.buttonText}
            </Button>
          </div>

          <div className={styles.imageContent}>
            <div className={styles.serviceImage} />
          </div>
        </div>
      ))}
    </section>
  );
}
