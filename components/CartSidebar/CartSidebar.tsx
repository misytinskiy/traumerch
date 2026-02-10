"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getPriceForQuantity, getMinQuantity } from "../../lib/pricing";
import { getMainPhotoUrl } from "../../lib/product";
import Button from "../Button/Button";
import styles from "./CartSidebar.module.css";

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden
  >
    <g clipPath="url(#clip0_close)">
      <rect
        x="10.4258"
        y="35.875"
        width="36"
        height="2.4"
        transform="rotate(-45 10.4258 35.875)"
        fill="currentColor"
      />
      <rect
        x="10.4258"
        y="12.125"
        width="2.4"
        height="36"
        transform="rotate(-45 10.4258 12.125)"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_close">
        <rect width="48" height="48" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const RemoveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden
  >
    <g clipPath="url(#clip0_remove)">
      <rect
        x="6.08203"
        y="20.9297"
        width="21"
        height="1.4"
        transform="rotate(-45 6.08203 20.9297)"
        fill="currentColor"
      />
      <rect
        x="6.08203"
        y="7.07031"
        width="1.4"
        height="21"
        transform="rotate(-45 6.08203 7.07031)"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_remove">
        <rect width="28" height="28" rx="14" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default function CartSidebar() {
  const router = useRouter();
  const { isCartOpen, closeCart, items, removeItem, updateItemQuantity } =
    useCart();
  const { t } = useLanguage();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  useEffect(() => {
    setQuantityInputByIndex({});
  }, [items.length]);

  const getItemTotalPrice = (item: {
    quantity: number;
    productFields?: Record<string, unknown>;
  }) => getPriceForQuantity(item.quantity, item.productFields);

  const [quantityInputByIndex, setQuantityInputByIndex] = useState<
    Record<number, string>
  >({});

  const getMinQtyForItem = (item: { productFields?: Record<string, unknown> }) =>
    getMinQuantity(item.productFields);

  const getQuantityDisplay = (index: number) => {
    const item = items[index];
    if (!item) return "1";
    const minQty = getMinQtyForItem(item);
    const stored = quantityInputByIndex[index];
    if (stored !== undefined) return stored;
    const q = item.quantity;
    if (minQty > 1 && q < minQty) return String(minQty);
    return String(q);
  };

  const handleQuantityInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value;
    if (raw === "" || /^\d*$/.test(raw)) {
      setQuantityInputByIndex((prev) => ({ ...prev, [index]: raw }));
      if (raw !== "") {
        const num = parseInt(raw, 10);
        const item = items[index];
        const minQty = item ? getMinQtyForItem(item) : 1;
        if (!Number.isNaN(num) && num >= minQty) {
          updateItemQuantity(index, Math.min(num, 99999));
        }
      }
    }
  };

  const handleQuantityBlur = (index: number) => {
    const item = items[index];
    const minQty = item ? getMinQtyForItem(item) : 1;
    const raw = getQuantityDisplay(index).trim();
    if (raw === "") {
      updateItemQuantity(index, minQty);
      setQuantityInputByIndex((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }
    const num = parseInt(raw, 10);
    if (Number.isNaN(num) || num < minQty) {
      updateItemQuantity(index, minQty);
      setQuantityInputByIndex((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } else {
      const clamped = Math.min(num, 99999);
      updateItemQuantity(index, clamped);
      setQuantityInputByIndex((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeCart();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={styles.panel}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeCart}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
              <h2 className={styles.title}>
                {t?.cart?.title ?? "YOUR QUOTE"}
              </h2>
            </div>

            <div className={styles.list}>
              {items.length === 0 ? (
                <p className={styles.empty}>
                  {t?.cart?.empty ?? "No items in your quote yet."}
                </p>
              ) : (
                items.map((item, index) => {
                  const itemImageUrl = getMainPhotoUrl(item.productFields);
                  const minQty = getMinQtyForItem(item);
                  return (
                  <div key={`${item.productId}-${index}`} className={styles.item}>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeItem(index)}
                      aria-label="Remove"
                    >
                      <RemoveIcon />
                    </button>
                    <div className={styles.itemImage} aria-hidden>
                      {itemImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={itemImageUrl} alt="" />
                      ) : null}
                    </div>
                    <div className={styles.itemContent}>
                      <h3 className={styles.itemName}>{item.productName}</h3>
                      <p className={styles.itemPrice}>
                        {(t?.cart?.price ?? "Estimated price: X").replace(
                          "X",
                          getItemTotalPrice(item) ?? "—"
                        )}
                      </p>
                      <p className={styles.itemColor}>
                        Color:{" "}
                        {item.selectedColor ? (
                          <span
                            className={styles.itemColorSwatch}
                            style={{ backgroundColor: item.selectedColor }}
                            aria-hidden
                          />
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div className={styles.quantityControl}>
                      <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={() => {
                          const next = Math.max(minQty, item.quantity - 1);
                          updateItemQuantity(index, next);
                          setQuantityInputByIndex((prev) => ({
                            ...prev,
                            [index]: String(next),
                          }));
                        }}
                        disabled={item.quantity <= minQty}
                      >
                        <svg width="12" height="1" viewBox="0 0 12 1" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <rect width="12" height="1" rx="0.5" fill="currentColor" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        className={styles.quantityValue}
                        value={getQuantityDisplay(index)}
                        min={minQty}
                        max={99999}
                        onChange={(e) => handleQuantityInputChange(index, e)}
                        onBlur={() => handleQuantityBlur(index)}
                        aria-label="Quantity"
                      />
                      <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={() => {
                          const next = Math.min(99999, item.quantity + 1);
                          updateItemQuantity(index, next);
                          setQuantityInputByIndex((prev) => ({
                            ...prev,
                            [index]: String(next),
                          }));
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                          <rect y="5.92188" width="12.5" height="0.657895" rx="0.328947" fill="currentColor" />
                          <rect x="5.92114" y="12.5" width="12.5" height="0.657895" rx="0.328947" transform="rotate(-90 5.92114 12.5)" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className={styles.footer}>
                <Button
                  variant="solid"
                  padding="32px 60px"
                  arrow="white"
                  onClick={() => {
                    closeCart();
                    router.push("/quote/view");
                  }}
                >
                  {t?.cart?.viewQuote ?? "VIEW MY QUOTE"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
