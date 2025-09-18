"use client";

import Header from "../../components/Header/Header";
import ProductDetails from "../../components/ProductDetails/ProductDetails";
import PromiseDesign from "../../components/PromiseDesign/PromiseDesign";
import CTA from "../../components/CTA/CTA";
import Services from "../../components/Services/Services";
import Footer from "../../components/Footer/Footer";
import styles from "./design.module.css";

export default function Design() {
  return (
    <div className={styles.page}>
      <Header />
      <main>
        {/* Unified product details section */}
        <ProductDetails />

        {/* Promise section with 3 images */}
        <PromiseDesign />

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
