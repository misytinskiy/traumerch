"use client";

import { useRef } from "react";
import Header from "../components/Header/Header";
import Hero from "../components/Hero/Hero";
import Gallery from "../components/Gallery/Gallery";
import Products from "../components/Products/Products";
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
      </main>
    </div>
  );
}
