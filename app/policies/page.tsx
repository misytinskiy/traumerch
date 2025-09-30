"use client";

import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import Policies from "../../components/Policies/Policies";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import styles from "./policies.module.css";

export default function PoliciesPage() {
  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main>
        <Policies />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
