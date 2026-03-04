"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCart } from "../../contexts/CartContext";
import ProductAccordion from "../ProductAccordion/ProductAccordion";
import ProductSlider from "../ProductSlider/ProductSlider";
import { getPriceForQuantity, getUnitPriceForQuantity } from "../../shared/pricing";
import {
  getMinQuantity,
  MAIN_PHOTO_FIELD,
  PALETTE_FIELD,
  parsePaletteData,
  SECONDARY_PHOTOS_FIELD,
} from "../../shared/productDetails";
import styles from "./ProductDetails.module.css";
import ProductGallery from "./ProductGallery";
import QuantityControl from "./QuantityControl";
import PriceSection from "./PriceSection";
import AddToQuoteButton from "./AddToQuoteButton";
import type { PhotoVariants } from "./types";
import useProductGallery from "../../hooks/useProductGallery";


type AirtableAttachment = {
  url?: string;
  thumbnails?: {
    small?: { url?: string };
    large?: { url?: string };
    full?: { url?: string };
  };
};

function normalizeAttachment(attachment: AirtableAttachment | null): PhotoVariants | null {
  if (!attachment) return null;
  const full =
    attachment.url && typeof attachment.url === "string" ? attachment.url : null;
  const large =
    attachment.thumbnails?.large?.url &&
    typeof attachment.thumbnails.large.url === "string"
      ? attachment.thumbnails.large.url
      : null;
  const small =
    attachment.thumbnails?.small?.url &&
    typeof attachment.thumbnails.small.url === "string"
      ? attachment.thumbnails.small.url
      : null;
  const fallback = large || small || full;
  if (!fallback) return null;
  return { full, large, small, fallback };
}

function getAttachmentArray(
  fields: Record<string, unknown> | undefined,
  fieldName: string
): AirtableAttachment[] {
  const raw = fields?.[fieldName];
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is AirtableAttachment => item && typeof item === "object");
}



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
  const outOfStockRaw = productRecord?.fields?.["Out of stock"] ?? productRecord?.fields?.["Out of Stock"];
  const isOutOfStock =
    outOfStockRaw === true ||
    outOfStockRaw === "true" ||
    outOfStockRaw === 1 ||
    outOfStockRaw === "1";
  const paletteData = parsePaletteData(productRecord?.fields);
  const paletteColors = paletteData.colors;
  const hasRainbowPalette = paletteData.hasRainbow;
  const paletteFieldRaw = productRecord?.fields?.[PALETTE_FIELD];
  const [photoState, setPhotoState] = useState<{
    all: PhotoVariants[];
  }>({ all: [] });
  const {
    selectedPhotoIndex,
    sliderRef,
    handleThumbnailClick,
    handleDotClick,
    handleSliderScroll,
  } = useProductGallery({ photos: photoState.all });
  const [selectedColor, setSelectedColor] = useState("");
  const [customColorPicked, setCustomColorPicked] = useState(false);
  const isCustomColor = hasRainbowPalette && customColorPicked;

  useEffect(() => {
    if (paletteColors.length > 0) {
      if (
        selectedColor === "" ||
        (!paletteColors.includes(selectedColor) && !hasRainbowPalette)
      ) {
        setSelectedColor(paletteColors[0]);
        setCustomColorPicked(false);
      }
    } else if (!hasRainbowPalette && selectedColor !== "") {
      setCustomColorPicked(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync selectedColor when product/palette changes
  }, [productRecord?.id, paletteFieldRaw, hasRainbowPalette, paletteColors, selectedColor]);
  const [quantity, setQuantity] = useState(10);
  const [quantityInputValue, setQuantityInputValue] = useState("10");
  const [description, setDescription] = useState("");

  const minQuantity = getMinQuantity(productRecord?.fields);

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

  // Keep main/thumbnail photos in sync with product fields
  useEffect(() => {
    if (!productRecord?.fields) {
      setPhotoState({ all: [] });
      return;
    }
    const mainAttachment = getAttachmentArray(productRecord.fields, MAIN_PHOTO_FIELD)[0] ?? null;
    const secondaryAttachments = getAttachmentArray(
      productRecord.fields,
      SECONDARY_PHOTOS_FIELD
    );
    const mainPhoto = normalizeAttachment(mainAttachment);
    const secondaryPhotos = secondaryAttachments
      .map((attachment) => normalizeAttachment(attachment))
      .filter((photo): photo is PhotoVariants => Boolean(photo));

    const allPhotos = mainPhoto ? [mainPhoto, ...secondaryPhotos] : secondaryPhotos;
    setPhotoState({ all: allPhotos });
  }, [
    productRecord?.id,
    productRecord?.fields?.[MAIN_PHOTO_FIELD],
    productRecord?.fields?.[SECONDARY_PHOTOS_FIELD],
  ]);

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

  const selectedPhoto = photoState.all[selectedPhotoIndex] ?? null;
  const mainPhotoUrl =
    selectedPhoto?.full || selectedPhoto?.large || selectedPhoto?.small || null;
  const thumbnailPhotos = photoState.all;
  const imageAlt = productName ?? t.design.productName;


  return (
    <section className={styles.productDetails}>
      {/* Product Customizer Section */}
      <div className={styles.customizerSection}>
        <ProductGallery
          isLoading={isLoading}
          mainPhotoUrl={mainPhotoUrl}
          thumbnailPhotos={thumbnailPhotos}
          selectedPhotoIndex={selectedPhotoIndex}
          onThumbnailClick={handleThumbnailClick}
          onDotClick={handleDotClick}
          sliderRef={sliderRef}
          onSliderScroll={handleSliderScroll}
          selectedColor={selectedColor}
          imageAlt={imageAlt}
        />

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
                : (
                    <>
                      {hasRainbowPalette && (
                        <div
                          className={`${styles.colorOption} ${styles.colorPickerOption} ${
                            isCustomColor ? styles.selected : ""
                          }`}
                          style={{
                            background: isCustomColor ? selectedColor : undefined,
                          }}
                          aria-label="Custom color"
                        >
                          <input
                            type="color"
                            className={styles.colorPickerInput}
                            value={selectedColor || "#000000"}
                            onChange={(event) => {
                              setSelectedColor(event.target.value);
                              setCustomColorPicked(true);
                            }}
                            aria-label="Custom color picker"
                          />
                        </div>
                      )}
                      {paletteColors.map((color, index) => (
                        <button
                          key={index}
                          className={`${styles.colorOption} ${
                            selectedColor === color ? styles.selected : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setSelectedColor(color);
                            setCustomColorPicked(false);
                          }}
                          aria-label={`Color ${index + 1}`}
                        />
                      ))}
                    </>
                  )}
            </div>
          </div>

          <div className={styles.divider} />

          <QuantityControl
            isLoading={isLoading}
            quantity={quantity}
            quantityDisplayValue={quantityDisplayValue}
            minQuantity={minQuantity}
            onDecrement={decrementQuantity}
            onIncrement={incrementQuantity}
            onChange={handleQuantityInputChange}
            onBlur={handleQuantityBlur}
            label={t.design.quantity}
          />

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

          <div className={styles.divider} />

          <PriceSection
            isLoading={isLoading}
            isOutOfStock={isOutOfStock}
            priceDisplay={priceDisplay}
            unitPriceDisplay={unitPriceDisplay}
            leadTimeDisplay={leadTimeDisplay}
            t={t}
          />

          <AddToQuoteButton
            isOutOfStock={isOutOfStock}
            isLoading={isLoading}
            hasRecord={Boolean(productRecord)}
            onClick={() => {
              if (isOutOfStock || isLoading || !productRecord) return;
              if (productId) {
                addItem({
                  productId,
                  productName: productName ?? t.design.productName,
                  quantity: Math.max(minQuantity, getEffectiveQuantity()),
                  selectedColor,
                  description: description.trim() || undefined,
                  productFields: productRecord?.fields,
                });
              }
            }}
            label={t.design.seePromise}
            outOfStockLabel={t.common.outOfStock}
          />
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
