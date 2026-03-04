"use client";

import styles from "./ProductDetails.module.css";

const PlusIcon = () => (
  <svg
    width="54"
    height="54"
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="54" height="54" rx="27" fill="black" fillOpacity="0.04" />
    <rect x="17.5" y="26.5" width="19" height="1" rx="0.5" fill="black" />
    <rect
      x="26.5"
      y="36.5"
      width="19"
      height="1"
      rx="0.5"
      transform="rotate(-90 26.5 36.5)"
      fill="black"
    />
  </svg>
);

const MinusIcon = () => (
  <svg
    width="54"
    height="54"
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="54"
      height="54"
      rx="27"
      transform="matrix(-1 0 0 1 54 0)"
      fill="black"
      fillOpacity="0.04"
    />
    <rect x="17.5" y="26.5" width="19" height="1" rx="0.5" fill="black" />
  </svg>
);

export default function QuantityControl({
  isLoading,
  quantity,
  quantityDisplayValue,
  minQuantity,
  onDecrement,
  onIncrement,
  onChange,
  onBlur,
  label,
}: {
  isLoading: boolean;
  quantity: number;
  quantityDisplayValue: string;
  minQuantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  label: string;
}) {
  return (
    <div className={styles.optionGroup}>
      <h3 className={styles.optionLabel}>{label}</h3>
      {isLoading ? (
        <div className={styles.quantitySkeletonRow}>
          <div className={`${styles.quantityButton} ${styles.skeletonBlock}`} />
          <div className={`${styles.quantityValue} ${styles.skeletonBlock}`} />
          <div className={`${styles.quantityButton} ${styles.skeletonBlock}`} />
        </div>
      ) : (
        <div className={styles.quantityControl}>
          <button
            className={styles.quantityButton}
            onClick={onDecrement}
            disabled={quantity <= minQuantity}
          >
            <MinusIcon />
          </button>
          <input
            type="number"
            className={styles.quantityValue}
            value={quantityDisplayValue}
            min={minQuantity}
            max={99999}
            step={1}
            onChange={onChange}
            onBlur={onBlur}
            aria-label={label}
          />
          <button className={styles.quantityButton} onClick={onIncrement}>
            <PlusIcon />
          </button>
        </div>
      )}
    </div>
  );
}
