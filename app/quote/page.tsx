"use client";

import { useEffect, useState } from "react";
import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import Footer from "../../components/Footer/Footer";
import CTA from "../../components/CTA/CTA";
import QuoteForm from "../../components/QuoteForm/QuoteForm";
import styles from "./quote.module.css";

export default function QuotePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`${styles.page} ${isVisible ? styles.pageVisible : ""}`}>
      <ResponsiveHeader />
      <QuoteForm />
      <CTA />
      <Footer />
    </div>
  );
}
