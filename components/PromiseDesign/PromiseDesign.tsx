"use client";

import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./PromiseDesign.module.css";

export default function PromiseDesign() {
  const { t } = useLanguage();

  // Create array of 3 images using frame2.png
  const images = Array.from({ length: 3 }, (_, index) => ({
    id: index + 1,
    src: "/frame2.png",
    alt: `Promise image ${index + 1}`,
  }));

  return (
    <section className={styles.promise}>
      <div className={styles.header}>
        <SectionTitle maxWidth={470}>{t.promise.title}</SectionTitle>
      </div>

      <div className={styles.grid}>
        {images.map((image) => (
          <div key={image.id} className={styles.imageItem}>
            <Image
              src={image.src}
              alt={image.alt}
              width={527}
              height={452}
              priority={true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
