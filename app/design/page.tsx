"use client";

import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import ProductDetails from "../../components/ProductDetails/ProductDetails";
import CTA from "../../components/CTA/CTA";
import Services from "../../components/Services/Services";
import Footer from "../../components/Footer/Footer";
import styles from "./design.module.css";

export default function Design() {
  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main>
        {/* Unified product details section */}
        <ProductDetails />

        {/* Services section */}
        <Services />

        {/* CTA section */}
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
