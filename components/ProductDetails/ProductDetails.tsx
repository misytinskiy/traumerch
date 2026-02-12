"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCart } from "../../contexts/CartContext";
import Button from "../Button/Button";
import ProductAccordion from "../ProductAccordion/ProductAccordion";
import ProductSlider from "../ProductSlider/ProductSlider";
import { getPriceForQuantity, getUnitPriceForQuantity } from "../../lib/pricing";
import styles from "./ProductDetails.module.css";

const PALETTE_FIELD = "[WEB] Palette Hex Colours";
const MAIN_PHOTO_FIELD = "Main Product Photo";

function getMainPhotoUrls(fields: Record<string, unknown> | undefined): {
  full: string | null;
  large: string | null;
  small: string | null;
  fallback: string | null;
} {
  const raw = fields?.[MAIN_PHOTO_FIELD];
  if (!Array.isArray(raw) || raw.length === 0) {
    return { full: null, large: null, small: null, fallback: null };
  }
  const first =
    raw[0] && typeof raw[0] === "object"
      ? (raw[0] as {
          url?: string;
          thumbnails?: {
            small?: { url?: string };
            large?: { url?: string };
            full?: { url?: string };
          };
        })
      : null;
  const full =
    first?.url && typeof first.url === "string" ? first.url : null;
  const large =
    first?.thumbnails?.large?.url &&
    typeof first.thumbnails.large.url === "string"
      ? first.thumbnails.large.url
      : null;
  const small =
    first?.thumbnails?.small?.url &&
    typeof first.thumbnails.small.url === "string"
      ? first.thumbnails.small.url
      : null;
  const fallback = large || small || full;
  return { full, large, small, fallback };
}

function parsePaletteHex(fields: Record<string, unknown> | undefined): string[] {
  const raw = fields?.[PALETTE_FIELD];
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(s));
}

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

interface ProductDetailsProps {
  productId?: string;
  productName?: string | null;
  productRecord?: { id: string; fields: Record<string, unknown> } | null;
}

export default function ProductDetails({
  productId,
  productName,
  productRecord,
}: ProductDetailsProps) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const isLoading = Boolean(productId && !productRecord);
  const paletteColors = parsePaletteHex(productRecord?.fields);
  const paletteFieldRaw = productRecord?.fields?.[PALETTE_FIELD];
  const mainPhoto = getMainPhotoUrls(productRecord?.fields);
  const mainPhotoUrl = mainPhoto.full || mainPhoto.large || mainPhoto.small || null;
  const thumbnailUrl = mainPhoto.small || mainPhoto.large || mainPhoto.full || null;
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    if (paletteColors.length > 0 && (selectedColor === "" || !paletteColors.includes(selectedColor))) {
      setSelectedColor(paletteColors[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync selectedColor when product/palette changes
  }, [productRecord?.id, paletteFieldRaw]);
  const [quantity, setQuantity] = useState(10);
  const [quantityInputValue, setQuantityInputValue] = useState("10");
  const [description, setDescription] = useState("");
  const [selectedCustomization, setSelectedCustomization] = useState("option1");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([
    "option1",
  ]);

  const customizationOptions = [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Option 5",
  ];
  const placementOptions = ["Option 1", "Option 2", "Option 3", "Option 4"];

  // Minimum order quantity from Airtable (try possible field names), fallback 1
  const minQuantity = (() => {
    const fields = productRecord?.fields;
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
  })();

  const getEffectiveQuantity = () => {
    const raw = quantityInputValue.trim();
    if (raw === "") return quantity;
    const num = parseInt(raw, 10);
    if (Number.isNaN(num) || num < minQuantity) return quantity;
    return Math.min(num, 99999);
  };

  const incrementQuantity = () => {
    const effective = getEffectiveQuantity();
    const next = Math.min(effective + 1, 99999);
    setQuantity(next);
    setQuantityInputValue(String(next));
  };
  const decrementQuantity = () => {
    const effective = getEffectiveQuantity();
    const next = Math.max(minQuantity, effective - 1);
    setQuantity(next);
    setQuantityInputValue(String(next));
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^\d*$/.test(raw)) {
      setQuantityInputValue(raw);
      if (raw !== "") {
        const num = parseInt(raw, 10);
        if (!Number.isNaN(num) && num >= minQuantity) {
          setQuantity(Math.min(num, 99999));
        }
      }
    }
  };

  const handleQuantityBlur = () => {
    const raw = quantityInputValue.trim();
    if (raw === "") {
      setQuantity(minQuantity);
      setQuantityInputValue(String(minQuantity));
      return;
    }
    const num = parseInt(raw, 10);
    if (Number.isNaN(num) || num < minQuantity) {
      setQuantity(minQuantity);
      setQuantityInputValue(String(minQuantity));
    } else {
      const clamped = Math.min(num, 99999);
      setQuantity(clamped);
      setQuantityInputValue(String(clamped));
    }
  };

  // When product/MOQ is set, set quantity to minQuantity so we never show below MOQ
  useEffect(() => {
    if (!productRecord || minQuantity <= 1) return;
    setQuantity(minQuantity);
    setQuantityInputValue(String(minQuantity));
  }, [productRecord?.id, minQuantity]);

  // Пока state не синхронизирован с MOQ, показываем minQuantity в инпуте (убирает мелькание 10)
  const quantityDisplayValue =
    productRecord && minQuantity > 1 && quantity < minQuantity
      ? String(minQuantity)
      : quantityInputValue;

  const togglePlacement = (optionKey: string) => {
    setSelectedPlacements((prev) => {
      if (prev.includes(optionKey)) {
        return prev.filter((item) => item !== optionKey);
      } else {
        return [...prev, optionKey];
      }
    });
  };

  // Считаем цену и lead time из записи товара при каждом рендере
  const effectiveQuantity = getEffectiveQuantity();
  const priceDisplay = getPriceForQuantity(
    effectiveQuantity,
    productRecord?.fields
  );
  const unitPriceDisplay = getUnitPriceForQuantity(
    effectiveQuantity,
    productRecord?.fields
  );
  const leadTimeRaw = productRecord?.fields?.["Total Time (Days)"];
  const leadTimeDisplay =
    leadTimeRaw !== undefined && leadTimeRaw !== null && leadTimeRaw !== ""
      ? String(leadTimeRaw)
      : null;

  return (
    <section className={styles.productDetails}>
      {/* Product Customizer Section */}
      <div className={styles.customizerSection}>
        <div className={styles.imageSection}>
          <div className={styles.mainImageContainer}>
            {isLoading ? (
              <div className={`${styles.mainImage} ${styles.skeletonBlock}`} />
            ) : mainPhotoUrl ? (
              <div className={`${styles.mainImage} ${styles.imageWrap}`}>
                <Image
                  src={mainPhotoUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                  className={styles.imageContent}
                  priority
                />
              </div>
            ) : (
              <div
                className={styles.mainImage}
                style={{ backgroundColor: selectedColor }}
              />
            )}
          </div>
          <div className={styles.thumbnails}>
            {isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${styles.skeletonBlock}`}
                  />
                ))
              : thumbnailUrl
              ? Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${styles.imageWrap}`}
                  >
                    <Image
                      src={thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 25vw, 96px"
                      className={styles.imageContent}
                      loading="lazy"
                    />
                  </div>
                ))
              : Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className={styles.thumbnail}
                    style={{ backgroundColor: selectedColor }}
                  />
                ))}
          </div>
        </div>

        <div className={styles.optionsSection}>
          {productId && productName === null ? (
            <div className={styles.productNameSkeleton} aria-hidden />
          ) : (
            <h1 className={styles.productName}>
              {productName ?? t.design.productName}
            </h1>
          )}

          <div className={styles.divider} />

          <div className={styles.optionGroup}>
            <h3 className={styles.optionLabel}>{t.design.color}</h3>
            <div className={styles.colorGrid}>
              {isLoading
                ? Array.from({ length: 6 }, (_, index) => (
                    <div
                      key={index}
                      className={`${styles.colorOption} ${styles.skeletonBlock}`}
                    />
                  ))
                : paletteColors.map((color, index) => (
                    <button
                      key={index}
                      className={`${styles.colorOption} ${
                        selectedColor === color ? styles.selected : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Color ${index + 1}`}
                    />
                  ))}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.optionGroup}>
            <h3 className={styles.optionLabel}>{t.design.quantity}</h3>
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
                  onClick={decrementQuantity}
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
                  onChange={handleQuantityInputChange}
                  onBlur={handleQuantityBlur}
                  aria-label={t.design.quantity}
                />
                <button
                  className={styles.quantityButton}
                  onClick={incrementQuantity}
                >
                  <PlusIcon />
                </button>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.optionGroup}>
            <h3 className={styles.optionLabel}>{t.design.description}</h3>
            {isLoading ? (
              <div className={styles.descriptionSkeleton} />
            ) : (
              <div className={styles.descriptionInputWrap}>
                <textarea
                  className={styles.descriptionInput}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
                  maxLength={1500}
                  placeholder=""
                  rows={4}
                  aria-label={t.design.description}
                />
                <span className={styles.descriptionCounter}>
                  {description.length} / 1500
                </span>
              </div>
            )}
          </div>

          {/* Скрыто пока: Customisation type и Design placement */}
          <div className={styles.hiddenSection} aria-hidden>
            <div className={styles.optionGroup}>
              <h3 className={styles.optionLabel}>{t.design.customisationType}</h3>
              <div className={styles.optionButtons}>
                {customizationOptions.map((option, index) => (
                  <button
                    key={index}
                    className={`${styles.optionButton} ${
                      selectedCustomization === `option${index + 1}`
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => setSelectedCustomization(`option${index + 1}`)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.optionGroup}>
              <h3 className={styles.optionLabel}>{t.design.designPlacement}</h3>
              <div className={styles.optionButtons}>
                {placementOptions.map((option, index) => (
                  <button
                    key={index}
                    className={`${styles.optionButton} ${
                      selectedPlacements.includes(`option${index + 1}`)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => togglePlacement(`option${index + 1}`)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

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
                  {(t.design.price as string).replace("X", priceDisplay ?? "—")}
                </p>
                <p className={styles.pricePerUnitText}>
                  {(t.design?.pricePerUnit ?? "Price per unit: X").replace(
                    "X",
                    unitPriceDisplay ?? "—"
                  )}
                </p>
                <p className={styles.leadTimeText}>
                  {(t.design.leadTime as string).replace(
                    "Y",
                    leadTimeDisplay
                      ? `${leadTimeDisplay} ${(t.design as { days?: string }).days ?? "days"}`
                      : "—"
                  )}
                </p>
              </>
            )}
          </div>

          <Button
            variant="solid"
            padding="26px 44px"
            arrow="white"
            className={styles.fullWidthButton}
            onClick={() => {
              if (productId) {
                addItem({
                  productId,
                  productName: productName ?? t.design.productName,
                  quantity: Math.max(minQuantity, getEffectiveQuantity()),
                  selectedColor,
                  selectedCustomization,
                  selectedPlacements,
                  description: description.trim() || undefined,
                  productFields: productRecord?.fields,
                });
              }
            }}
          >
            {t.design.seePromise}
          </Button>
        </div>
      </div>

      {/* Product Info Section */}
      <div className={styles.infoSection}>
        <h2 className={styles.title}>{t.design.knowYourProduct}</h2>
        <div className={styles.accordionSliderSection}>
          <div className={styles.accordionSection}>
            {isLoading ? (
              <div className={`${styles.accordionSkeleton} ${styles.skeletonBlock}`} />
            ) : (
              <ProductAccordion productFields={productRecord?.fields} />
            )}
          </div>

          <div className={styles.sliderSection}>
            <ProductSlider />
          </div>
        </div>
      </div>
    </section>
  );
}
