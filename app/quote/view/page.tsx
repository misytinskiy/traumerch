"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResponsiveHeader from "../../../components/Header/ResponsiveHeader";
import CTA from "../../../components/CTA/CTA";
import Footer from "../../../components/Footer/Footer";
import Button from "../../../components/Button/Button";
import { useCart } from "../../../contexts/CartContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { getMainPhotoUrl, getProductNameFromFields } from "../../../lib/product";
import styles from "./quote-view.module.css";

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <path
      d="M16.25 4.58073L15.7333 12.9349C15.6017 15.0691 15.5358 16.1366 15 16.9041C14.7355 17.2834 14.3949 17.6035 14 17.8441C13.2025 18.3307 12.1333 18.3307 9.995 18.3307C7.85333 18.3307 6.7825 18.3307 5.98333 17.8432C5.58824 17.6022 5.24768 17.2815 4.98333 16.9016C4.44833 16.1332 4.38333 15.0641 4.255 12.9266L3.75 4.58073M2.5 4.58073H17.5M13.38 4.58073L12.8108 3.4074C12.4333 2.6274 12.2442 2.23823 11.9183 1.9949C11.846 1.94099 11.7693 1.89306 11.6892 1.85156C11.3283 1.66406 10.895 1.66406 10.0292 1.66406C9.14083 1.66406 8.69667 1.66406 8.32917 1.85906C8.24793 1.90257 8.17044 1.95274 8.0975 2.00906C7.76833 2.26156 7.58417 2.66573 7.21583 3.47323L6.71083 4.58073M7.91667 13.7474V8.7474M12.0833 13.7474V8.7474"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <path
      d="M12 16V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8.5 9.5L12 6l3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18.5v-2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const getMinQuantity = (fields: Record<string, unknown> | undefined) => {
  if (!fields) return 1;
  const keys = ["# MOQ | SALES", "MOQ | SALES", "# MOQ", "MOQ"];
  let raw: unknown;
  for (const key of keys) {
    if (key in fields && fields[key] !== undefined && fields[key] !== null && fields[key] !== "") {
      raw = fields[key];
      break;
    }
  }
  if (raw === undefined) return 1;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) || n < 1 ? 1 : Math.min(n, 99999);
};

const getSwatchColor = (color: string) => {
  if (!color) return "#111";
  if (color.startsWith("#")) return color;
  const normalized = color.toLowerCase();
  if (normalized === "white") return "#f5f5f5";
  if (normalized === "black") return "#111";
  return normalized;
};

export default function QuoteViewPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const {
    items,
    removeItem,
    updateItemQuantity,
    updateItemDescription,
    updateItemFile,
  } =
    useCart();
  const [quantityInputByIndex, setQuantityInputByIndex] = useState<
    Record<number, string>
  >({});
  const [fileNamesByIndex, setFileNamesByIndex] = useState<
    Record<number, string>
  >({});

  const displayItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      minQuantity: getMinQuantity(item.productFields),
    }));
  }, [items]);

  const getQuantityDisplay = (index: number, fallback: number) => {
    const raw = quantityInputByIndex[index];
    if (raw === undefined) return String(fallback);
    return raw;
  };

  const handleQuantityChange = (
    index: number,
    value: string,
    minQuantity: number
  ) => {
    setQuantityInputByIndex((prev) => ({ ...prev, [index]: value }));
    const trimmed = value.trim();
    if (trimmed === "") return;
    const num = parseInt(trimmed, 10);
    if (!Number.isNaN(num)) {
      updateItemQuantity(index, Math.max(minQuantity, Math.min(num, 99999)));
    }
  };

  const handleQuantityBlur = (
    index: number,
    minQuantity: number,
    currentQuantity: number
  ) => {
    const raw = quantityInputByIndex[index];
    if (raw === undefined || raw.trim() === "") {
      setQuantityInputByIndex((prev) => ({
        ...prev,
        [index]: String(currentQuantity),
      }));
      return;
    }
    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) {
      setQuantityInputByIndex((prev) => ({
        ...prev,
        [index]: String(currentQuantity),
      }));
      return;
    }
    const clamped = Math.max(minQuantity, Math.min(num, 99999));
    setQuantityInputByIndex((prev) => ({
      ...prev,
      [index]: String(clamped),
    }));
    updateItemQuantity(index, clamped);
  };

  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>{t.quoteView.title}</h1>

        <div className={styles.list}>
          {displayItems.length === 0 && (
            <div className={styles.empty}>{t.quoteView.empty}</div>
          )}

          {displayItems.map((item, index) => {
            const photoUrl = getMainPhotoUrl(item.productFields) ?? "";
            const displayName = getProductNameFromFields(
              item.productFields,
              language,
              item.productName
            );
            const minQuantity = item.minQuantity;
            return (
              <article className={styles.card} key={`${item.productId}-${index}`}>
                <div className={styles.media}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder} />
                  )}
                </div>

                <div className={styles.details}>
                  <div className={styles.headerRow}>
                    <h2 className={styles.productName}>{displayName}</h2>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => removeItem(index)}
                    >
                      <span>{t.quoteView.delete}</span>
                      <TrashIcon />
                    </button>
                  </div>

                  <div className={styles.metaBlock}>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>
                        {t.quoteView.color}:
                      </span>
                      <span className={styles.colorValue}>
                        <span
                          className={styles.colorSwatch}
                          style={{ backgroundColor: getSwatchColor(item.selectedColor) }}
                        />
                        {item.selectedColor || "-"}
                      </span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>
                        {t.quoteView.quantityMin}: {minQuantity}
                      </span>
                      <div className={styles.quantityControls}>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => {
                            const next = Math.max(minQuantity, item.quantity - 1);
                            updateItemQuantity(index, next);
                            setQuantityInputByIndex((prev) => ({
                              ...prev,
                              [index]: String(next),
                            }));
                          }}
                          disabled={item.quantity <= minQuantity}
                        >
                          <svg width="12" height="1" viewBox="0 0 12 1" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <rect width="12" height="1" rx="0.5" fill="currentColor" />
                          </svg>
                        </button>
                        <input
                          type="number"
                          className={styles.quantityInput}
                          value={getQuantityDisplay(index, item.quantity)}
                          min={minQuantity}
                          max={99999}
                          onChange={(e) =>
                            handleQuantityChange(index, e.target.value, minQuantity)
                          }
                          onBlur={() =>
                            handleQuantityBlur(index, minQuantity, item.quantity)
                          }
                          aria-label={t.quoteView.quantityAria}
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
                    {/* <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>Quantity method:</span>
                      <span className={styles.metaRight}>Printing</span>
                    </div> */}
                  </div>

                  <div className={styles.descriptionBlock}>
                    <textarea
                      className={styles.descriptionInput}
                      placeholder={t.quoteView.descriptionPlaceholder}
                      value={item.description ?? ""}
                      onChange={(e) =>
                        updateItemDescription(index, e.target.value)
                      }
                    />
                  </div>

                  <div className={styles.uploadRow}>
                    <label className={styles.uploadLabel}>
                      <UploadIcon />
                      <span>{t.quoteView.fileUpload}</span>
                      <input
                        type="file"
                        className={styles.fileInput}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          updateItemFile(index, file);
                          setFileNamesByIndex((prev) => ({
                            ...prev,
                            [index]: file?.name ?? "",
                          }));
                        }}
                      />
                    </label>
                    {fileNamesByIndex[index] && (
                      <span className={styles.fileName}>
                        {fileNamesByIndex[index]}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.footerBar}>
          <Button
            variant="transparent"
            size="medium"
            padding="31px 84px"
            padding480="26px 70px"
            onClick={() => router.push("/catalog")}
          >
            {t.quoteView.backToShopping}
          </Button>
          <Button
            variant="solid"
            size="medium"
            padding="31px 94px"
            padding480="26px 70px"
            arrow="white"
            onClick={() => router.push("/quote/contact")}
          >
            {t.quoteView.continue}
          </Button>
        </div>
      </main>
      <CTA />
      <Footer />
    </div>
  );
}
