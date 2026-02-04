"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCart } from "../../contexts/CartContext";
import Button from "../Button/Button";
import ProductAccordion from "../ProductAccordion/ProductAccordion";
import ProductSlider from "../ProductSlider/ProductSlider";
import { getPriceForQuantity, getUnitPriceForQuantity } from "../../lib/pricing";
import styles from "./ProductDetails.module.css";

const colors = [
  "#F5F5F5", // Светло-серый
  "#E8E8E8", // Серый
  "#D4C5B9", // Бежевый
  "#C8A882", // Песочный
  "#B5A48B", // Теплый серый
  "#A8B5A0", // Мятный
  "#9BB5C4", // Пыльно-голубой
  "#C4A5A0", // Пыльно-розовый
  "#B8A8C8", // Лавандовый
  "#A8C4A2", // Шалфей
  "#D4B5A0", // Пыльный персик
  "#A0B5D4", // Мягкий голубой
  "#C8B5A8", // Молочный кофе
  "#B5C8A8", // Мягкий оливковый
  "#A8A8C8", // Серо-лавандовый
  "#C8A8B5", // Пыльная роза
  "#A8C8B5", // Морская пена
];

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
  const [selectedColor, setSelectedColor] = useState(colors[0]);
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

  const getEffectiveQuantity = () => {
    const raw = quantityInputValue.trim();
    if (raw === "") return quantity;
    const num = parseInt(raw, 10);
    if (Number.isNaN(num) || num < 1) return quantity;
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
    const next = Math.max(1, effective - 1);
    setQuantity(next);
    setQuantityInputValue(String(next));
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^\d*$/.test(raw)) {
      setQuantityInputValue(raw);
      if (raw !== "") {
        const num = parseInt(raw, 10);
        if (!Number.isNaN(num) && num >= 1) {
          setQuantity(Math.min(num, 99999));
        }
      }
    }
  };

  const handleQuantityBlur = () => {
    const raw = quantityInputValue.trim();
    if (raw === "") {
      setQuantity(1);
      setQuantityInputValue("1");
      return;
    }
    const num = parseInt(raw, 10);
    if (Number.isNaN(num) || num < 1) {
      setQuantity(1);
      setQuantityInputValue("1");
    } else {
      const clamped = Math.min(num, 99999);
      setQuantity(clamped);
      setQuantityInputValue(String(clamped));
    }
  };

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

  useEffect(() => {
    if (effectiveQuantity === 0) return;
    console.log("[ProductDetails] qty/price", {
      effectiveQuantity,
      priceDisplay,
    });
  }, [effectiveQuantity, priceDisplay]);

  return (
    <section className={styles.productDetails}>
      {/* Product Customizer Section */}
      <div className={styles.customizerSection}>
        <div className={styles.imageSection}>
          <div className={styles.mainImageContainer}>
            <div
              className={styles.mainImage}
              style={{ backgroundColor: selectedColor }}
            />
          </div>
          <div className={styles.thumbnails}>
            {Array.from({ length: 4 }, (_, index) => (
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
              {colors.map((color, index) => (
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
            <div className={styles.quantityControl}>
              <button
                className={styles.quantityButton}
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <MinusIcon />
              </button>
              <input
                type="number"
                className={styles.quantityValue}
                value={quantityInputValue}
                min={1}
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
          </div>

          <div className={styles.divider} />

          <div className={styles.optionGroup}>
            <h3 className={styles.optionLabel}>{t.design.description}</h3>
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
                  quantity,
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
            <ProductAccordion productFields={productRecord?.fields} />
          </div>

          <div className={styles.sliderSection}>
            <ProductSlider />
          </div>
        </div>
      </div>
    </section>
  );
}
