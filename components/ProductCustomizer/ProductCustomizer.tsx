"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./ProductCustomizer.module.css";

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
      fill-opacity="0.04"
    />
    <rect x="17.5" y="26.5" width="19" height="1" rx="0.5" fill="black" />
  </svg>
);

export default function ProductCustomizer() {
  const { t } = useLanguage();
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [quantity, setQuantity] = useState(10);
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

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const togglePlacement = (optionKey: string) => {
    setSelectedPlacements((prev) => {
      if (prev.includes(optionKey)) {
        return prev.filter((item) => item !== optionKey);
      } else {
        return [...prev, optionKey];
      }
    });
  };

  return (
    <section className={styles.customizer}>
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
        <h1 className={styles.productName}>{t.design.productName}</h1>

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
            <span className={styles.quantityValue}>{quantity}</span>
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

        <div className={styles.divider} />

        <div className={styles.priceSection}>
          <p className={styles.priceText}>{t.design.price}</p>
          <p className={styles.leadTimeText}>{t.design.leadTime}</p>
        </div>

        <Button
          variant="solid"
          padding="32px 44px"
          arrow="white"
          className={styles.fullWidthButton}
        >
          {t.design.seePromise}
        </Button>
      </div>
    </section>
  );
}
