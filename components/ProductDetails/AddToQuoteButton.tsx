"use client";

import Button from "../Button/Button";
import styles from "./ProductDetails.module.css";

export default function AddToQuoteButton({
  isOutOfStock,
  isLoading,
  hasRecord,
  onClick,
  label,
  outOfStockLabel,
}: {
  isOutOfStock: boolean;
  isLoading: boolean;
  hasRecord: boolean;
  onClick: () => void;
  label: string;
  outOfStockLabel: string;
}) {
  const disabled = isOutOfStock || isLoading || !hasRecord;

  return (
    <Button
      variant={isOutOfStock ? "transparent" : "solid"}
      padding="26px 44px"
      arrow={isOutOfStock ? "none" : "white"}
      className={`${styles.fullWidthButton} ${
        isOutOfStock ? styles.outOfStockButton : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {isOutOfStock ? outOfStockLabel : label}
    </Button>
  );
}
