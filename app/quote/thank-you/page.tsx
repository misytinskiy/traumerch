"use client";

import ResponsiveHeader from "../../../components/Header/ResponsiveHeader";
import Footer from "../../../components/Footer/Footer";
import CTA from "../../../components/CTA/CTA";
import { useLanguage } from "../../../contexts/LanguageContext";
import styles from "./thank-you.module.css";

export default function ThankYouPage() {
  const { t } = useLanguage();

  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>
          {t.quote?.thankYouTitle || "Thank you"}
        </h1>
        <p className={styles.description}>
          {t.quote?.thankYouDescription ||
            "Let's bring your ideas to life — from first design to delivery, we make the process simple and reliable."}
        </p>
        <div className={styles.imageContainer}>
          <video
            className={styles.thankYouImage}
            autoPlay
            muted
            playsInline
          >
            <source src="/thankYou.webm" type="video/webm" />
          </video>
        </div>
      </main>

      <CTA />

      <Footer />
    </div>
  );
}
