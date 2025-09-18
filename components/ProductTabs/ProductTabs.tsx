"use client";

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
import styles from "./ProductTabs.module.css";

interface Product {
  id: number;
  name: string;
  price: string;
  size: "regular" | "large";
}

export default function ProductTabs() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("allProducts");

  const tabs = [
    { key: "allProducts", label: t.catalog.tabs.allProducts, count: 38 },
    { key: "bags", label: t.catalog.tabs.bags, count: 38 },
    { key: "customProduct", label: t.catalog.tabs.customProduct, count: 38 },
    { key: "drinkware", label: t.catalog.tabs.drinkware, count: 38 },
    { key: "footwear", label: t.catalog.tabs.footwear, count: 38 },
    { key: "headwear", label: t.catalog.tabs.headwear, count: 38 },
    {
      key: "homewareAppliances",
      label: t.catalog.tabs.homewareAppliances,
      count: 38,
    },
    {
      key: "wearableAccessories",
      label: t.catalog.tabs.wearableAccessories,
      count: 38,
    },
    {
      key: "wearableTextile",
      label: t.catalog.tabs.wearableTextile,
      count: 38,
    },
  ];

  // Generate products for complex grid layout
  const generateProducts = (): Product[] => {
    const products: Product[] = [];
    let id = 1;

    // Row 1: 4 regular
    for (let i = 0; i < 4; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 2: 2 regular + 1 large
    for (let i = 0; i < 2; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }
    products.push({
      id: id++,
      name: "Heavy Tote Bag",
      price: "From €6",
      size: "large",
    });

    // Row 3: 4 regular
    for (let i = 0; i < 4; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 4: 1 large + 2 regular
    products.push({
      id: id++,
      name: "Heavy Tote Bag",
      price: "From €6",
      size: "large",
    });
    for (let i = 0; i < 2; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 5: 4 regular
    for (let i = 0; i < 4; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 6: 2 regular + 1 large
    for (let i = 0; i < 2; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }
    products.push({
      id: id++,
      name: "Heavy Tote Bag",
      price: "From €6",
      size: "large",
    });

    // Rows 7-9: 4 regular each (12 total)
    for (let i = 0; i < 12; i++) {
      products.push({
        id: id++,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    return products;
  };

  const products = generateProducts();

  const renderRow = (startIndex: number, pattern: string, rowClass: string) => {
    const currentIndex = startIndex;
    const rowProducts: Product[] = [];

    if (pattern === "4regular") {
      rowProducts.push(...products.slice(currentIndex, currentIndex + 4));
    } else if (pattern === "2regular1large") {
      rowProducts.push(...products.slice(currentIndex, currentIndex + 3));
    } else if (pattern === "1large2regular") {
      rowProducts.push(...products.slice(currentIndex, currentIndex + 3));
    }

    return (
      <div key={rowClass} className={styles[rowClass]}>
        {rowProducts.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={`${styles.productImage} ${styles[product.size]}`} />
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{product.price}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className={styles.tabs}>
      <div className={styles.header}>
        <SectionTitle maxWidth={721} fontSize={80}>
          {t.catalog.hero.title}
        </SectionTitle>
      </div>

      <div className={styles.tabList}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${
              activeTab === tab.key ? styles.active : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className={styles.count}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.productGrid}>
        {renderRow(0, "4regular", "row1")}
        {renderRow(4, "2regular1large", "row2")}
        {renderRow(7, "4regular", "row3")}
        {renderRow(11, "1large2regular", "row4")}
        {renderRow(14, "4regular", "row5")}
        {renderRow(18, "2regular1large", "row6")}
        {renderRow(21, "4regular", "row7")}
        {renderRow(25, "4regular", "row8")}
        {renderRow(29, "4regular", "row9")}
      </div>

      <div className={styles.seeMoreContainer}>
        <Button variant="transparent" padding="31px 42px">
          {t.catalog.seeMore}
        </Button>
      </div>
    </section>
  );
}
