"use client";

import styles from "./ProductDetails.module.css";

export default function PriceSection({
  isLoading,
  isOutOfStock,
  priceDisplay,
  unitPriceDisplay,
  leadTimeDisplay,
  t,
}: {
  isLoading: boolean;
  isOutOfStock: boolean;
  priceDisplay: string | null;
  unitPriceDisplay: string | null;
  leadTimeDisplay: string | null;
  t: {
    design: {
      price: string;
      pricePerUnit?: string;
      leadTime: string;
      days?: string;
    };
  };
}) {
  return (
    <div className={styles.priceSection}>
      {isLoading ? (
        <>
          <div className={`${styles.priceSkeletonLine} ${styles.skeletonBlock}`} />
          <div className={`${styles.priceSkeletonLine} ${styles.skeletonBlock}`} />
          <div className={`${styles.priceSkeletonLine} ${styles.skeletonBlock}`} />
        </>
      ) : (
        <>
          <p className={styles.priceText}>
            {(t.design.price as string).replace(
              "X",
              isOutOfStock ? "—" : priceDisplay ?? "—"
            )}
          </p>
          <p className={styles.pricePerUnitText}>
            {(t.design?.pricePerUnit ?? "Price per unit: X").replace(
              "X",
              isOutOfStock ? "—" : unitPriceDisplay ?? "—"
            )}
          </p>
          <p className={styles.leadTimeText}>
            {(t.design.leadTime as string).replace(
              "Y",
              !isOutOfStock && leadTimeDisplay
                ? `${leadTimeDisplay} ${t.design.days ?? "days"}`
                : "—"
            )}
          </p>
        </>
      )}
    </div>
  );
}
