"use client";

import PolicyAccordion from "../FAQ/PolicyAccordion";
import styles from "./Policies.module.css";

export default function Policies() {
  return (
    <section className={styles.policies}>
      <h2 className={styles.title}>All Policies. Single Overview.</h2>

      <div className={styles.accordionContainer}>
        <PolicyAccordion />
      </div>
    </section>
  );
}
