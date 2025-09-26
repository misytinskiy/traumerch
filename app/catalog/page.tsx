"use client";

import Header from "../../components/Header/Header";
import ProductTabs from "../../components/ProductTabs/ProductTabs";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import styles from "./catalog.module.css";

export default function Catalog() {

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
