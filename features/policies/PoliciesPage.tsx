"use client";

import Policies from "../../components/Policies/Policies";
import styles from "./policies.module.css";

export default function PoliciesPage() {
  return (
    <div className={styles.page}>
      <main>
        <Policies />
      </main>
    </div>
  );
}
