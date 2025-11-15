"use client";
import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import ProductTabs from "../../components/ProductTabs/ProductTabs";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import styles from "./catalog.module.css";

export default function Catalog() {
  return (
    <div className={styles.page}>
      <ResponsiveHeader />
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
