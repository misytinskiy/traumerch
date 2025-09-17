"use client";

import { useRef } from "react";
import Header from "../components/Header/Header";
import Hero from "../components/Hero/Hero";
import Gallery from "../components/Gallery/Gallery";
import Products from "../components/Products/Products";
import Promise from "../components/Promise/Promise";
import FAQ from "../components/FAQ/FAQ";
import Services from "../components/Services/Services";
import CTA from "../components/CTA/CTA";
import Footer from "../components/Footer/Footer";
import styles from "./page.module.css";

export default function Home() {
  const nextSectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToNext = () => {
    if (nextSectionRef.current) {
      nextSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main>
        <Hero onScrollClick={handleScrollToNext} />

        <div ref={nextSectionRef}>
          <Gallery />
        </div>

        <Products />

        <Services />

        <Promise />

        <FAQ />

        <CTA />
      </main>

      <Footer />
    </div>
  );
}
