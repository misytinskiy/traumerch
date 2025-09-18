"use client";

import Header from "../../components/Header/Header";
import ProductTabs from "../../components/ProductTabs/ProductTabs";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./catalog.module.css";

export default function Catalog() {
  const { t } = useLanguage();

  return (
    <div className={styles.page}>
      <Header />
      <main>
        {/* Product catalog with tabs and title */}
        <ProductTabs />

        {/* CTA section */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
