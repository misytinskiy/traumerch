"use client";

import Header from "../../components/Header/Header";
import Services from "../../components/Services/Services";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./solutions.module.css";

export default function Solutions() {
  const { t } = useLanguage();

  return (
    <div className={styles.page}>
      <Header />
      <main>
        {/* Hero-like section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>{t.solutions.hero.title}</h1>
        </section>

        {/* Extended Services section with all 5 services */}
        <Services showAll={true} />

        {/* CTA section */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
