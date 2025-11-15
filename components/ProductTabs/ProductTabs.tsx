"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./ProductTabs.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  size: "regular" | "large";
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

const TAB_KEYS = [
  "allProducts",
  "bags",
  "customProduct",
  "drinkware",
  "footwear",
  "headwear",
  "homewareAppliances",
  "wearableAccessories",
  "wearableTextile",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

const normalizeCategoryValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z]/g, "");

const CATEGORY_KEY_MAP: Record<string, TabKey> = {
  allproducts: "allProducts",
  bags: "bags",
  bag: "bags",
  customproduct: "customProduct",
  customproducts: "customProduct",
  custom: "customProduct",
  drinkware: "drinkware",
  footwear: "footwear",
  shoes: "footwear",
  headwear: "headwear",
  caps: "headwear",
  hats: "headwear",
  homewareappliances: "homewareAppliances",
  homeware: "homewareAppliances",
  appliances: "homewareAppliances",
  wearableaccessories: "wearableAccessories",
  accessories: "wearableAccessories",
  wearabletextile: "wearableTextile",
  textile: "wearableTextile",
  apparel: "wearableTextile",
};

const mapCategoryValue = (value: string): TabKey | null => {
  const normalized = normalizeCategoryValue(value);
  return CATEGORY_KEY_MAP[normalized] ?? null;
};

const extractStringValues = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return typeof value === "string" ? [value] : [];
};

export default function ProductTabs() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("allProducts");
  const [isMobile, setIsMobile] = useState(false);
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleProductClick = (productId: string) => {
    // Navigate to design page for the specific product
    window.location.href = `/design?product=${productId}`;
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setIsLoadingRecords(true);
        const response = await fetch("/api/airtable-products", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        const payload = await response.json();
        setRecords(payload.records ?? []);
        setFetchError(null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Airtable fetch error", error);
          setFetchError("Не удалось загрузить продукты");
        }
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setShowAll(false);
  }, [records.length, activeTab]);

  const categorizedRecords = useMemo(() => {
    const initial = TAB_KEYS.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as Record<TabKey, AirtableRecord[]>);

    records.forEach((record) => {
      const categories = new Set<TabKey>();
      categories.add("allProducts");

      const categoryValues = [
        ...extractStringValues(record.fields["Item Category"]),
        ...extractStringValues(record.fields["[WEB] Item Category"]),
      ];

      categoryValues.forEach((value) => {
        const mapped = mapCategoryValue(value);
        if (mapped && mapped !== "allProducts") {
          categories.add(mapped);
        }
      });

      categories.forEach((category) => {
        initial[category]?.push(record);
      });
    });

    return initial;
  }, [records]);

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TabKey, number>;
    TAB_KEYS.forEach((key) => {
      counts[key] = categorizedRecords[key]?.length ?? 0;
    });
    return counts;
  }, [categorizedRecords]);

  const activeRecords =
    records.length > 0 ? categorizedRecords[activeTab] ?? [] : [];

  const tabLabels: Record<TabKey, string> = {
    allProducts: t.catalog.tabs.allProducts,
    bags: t.catalog.tabs.bags,
    customProduct: t.catalog.tabs.customProduct,
    drinkware: t.catalog.tabs.drinkware,
    footwear: t.catalog.tabs.footwear,
    headwear: t.catalog.tabs.headwear,
    homewareAppliances: t.catalog.tabs.homewareAppliances,
    wearableAccessories: t.catalog.tabs.wearableAccessories,
    wearableTextile: t.catalog.tabs.wearableTextile,
  };

  const tabs = TAB_KEYS.map((key) => ({
    key,
    label: tabLabels[key],
    count: tabCounts[key] ?? 0,
  }));

  // Generate simple products for mobile (all regular size)
  const generateMobileProducts = (): Product[] => {
    const products: Product[] = [];
    for (let i = 1; i <= 20; i++) {
      products.push({
        id: `placeholder-mobile-${i}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }
    return products;
  };

  // Generate products for complex grid layout
  const generateProducts = (): Product[] => {
    const products: Product[] = [];
    let id = 1;

    // Row 1: 4 regular
    for (let i = 0; i < 4; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 2: 2 regular + 1 large
    for (let i = 0; i < 2; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }
    products.push({
      id: `placeholder-${id++}`,
      name: "Heavy Tote Bag",
      price: "From €6",
      size: "large",
    });

    // Row 3: 4 regular
    for (let i = 0; i < 4; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 4: 1 large + 2 regular
    products.push({
      id: `placeholder-${id++}`,
      name: "Heavy Tote Bag",
      price: "From €6",
      size: "large",
    });
    for (let i = 0; i < 2; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 5: 4 regular
    for (let i = 0; i < 4; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    // Row 6: 2 regular + 1 large
    for (let i = 0; i < 2; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }
    products.push({
      id: `placeholder-${id++}`,
      name: "Heavy Tote Bag",
      price: "From €6",
      size: "large",
    });

    // Rows 7-9: 4 regular each (12 total)
    for (let i = 0; i < 12; i++) {
      products.push({
        id: `placeholder-${id++}`,
        name: "Heavy Tote Bag",
        price: "From €6",
        size: "regular",
      });
    }

    return products;
  };

  const layoutPattern = useMemo(() => generateProducts().map((p) => p.size), []);
  const initialDesktopCapacity = layoutPattern.length;

  const mapRecordToProduct = (
    record: AirtableRecord,
    size: "regular" | "large" = "regular"
  ): Product => {
    const fields = record.fields || {};
    const name =
      (fields["[WEB] Name ENG"] as string | undefined) ||
      (fields["[WEB] Name DE"] as string | undefined) ||
      (fields["Name"] as string | undefined) ||
      "Product";

    const priceValue = fields["Price"];
    const price =
      typeof priceValue === "number"
        ? `From €${priceValue}`
        : (fields["[WEB] Price"] as string | undefined) || "From €6";

    return {
      id: record.id,
      name,
      price,
      size,
    };
  };

  const buildDesktopProducts = (sourceRecords: AirtableRecord[]) => {
    const sizes = [...layoutPattern];
    while (sizes.length < sourceRecords.length) {
      sizes.push("regular");
    }

    return sourceRecords.map((record, index) =>
      mapRecordToProduct(record, sizes[index] ?? "regular")
    );
  };

  const desktopProducts = useMemo(() => {
    if (!records.length) {
      return generateProducts();
    }

    if (!activeRecords.length) {
      return [];
    }

    return buildDesktopProducts(activeRecords);
  }, [records.length, activeRecords, layoutPattern]);

  const mobileProducts = useMemo(() => {
    if (!records.length) {
      return generateMobileProducts();
    }

    if (!activeRecords.length) {
      return [];
    }

    return activeRecords.map((record) => mapRecordToProduct(record, "regular"));
  }, [records.length, activeRecords]);

  const showEmptyState = records.length > 0 && activeRecords.length === 0;

  const extraDesktopProducts = useMemo(() => {
    if (!records.length || !desktopProducts.length || showEmptyState) {
      return [];
    }
    if (desktopProducts.length <= initialDesktopCapacity) {
      return [];
    }
    return desktopProducts.slice(initialDesktopCapacity);
  }, [desktopProducts, records.length, initialDesktopCapacity, showEmptyState]);

  const visibleDesktopProducts = useMemo(() => {
    if (!records.length) {
      return desktopProducts;
    }
    if (showEmptyState) {
      return [];
    }
    return desktopProducts.slice(0, initialDesktopCapacity);
  }, [desktopProducts, records.length, initialDesktopCapacity, showEmptyState]);

  const showExtraGrid = showAll && extraDesktopProducts.length > 0;
  const canShowMore =
    records.length > 0 &&
    !isMobile &&
    !showAll &&
    !showEmptyState &&
    extraDesktopProducts.length > 0;

  const emptyStateMessage =
    language === "de"
      ? "In dieser Kategorie gibt es noch keine Produkte."
      : "No products in this category yet.";

  const renderRow = (
    sourceProducts: Product[],
    startIndex: number,
    pattern: string,
    rowClass: string
  ) => {
    const currentIndex = startIndex;
    const rowProducts: Product[] = [];

    if (pattern === "4regular") {
      rowProducts.push(
        ...sourceProducts.slice(currentIndex, currentIndex + 4)
      );
    } else if (pattern === "2regular1large") {
      rowProducts.push(
        ...sourceProducts.slice(currentIndex, currentIndex + 3)
      );
    } else if (pattern === "1large2regular") {
      rowProducts.push(
        ...sourceProducts.slice(currentIndex, currentIndex + 3)
      );
    }

    return (
      <div key={rowClass} className={styles[rowClass]}>
        {rowProducts.map((product) => (
          <div
            key={product.id}
            className={styles.productCard}
            onClick={() => handleProductClick(product.id)}
            style={{ cursor: "pointer" }}
          >
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
        <h2 className={`${styles.title}`}>
          {t.catalog.hero.titleLine1} <br /> {t.catalog.hero.titleLine2}
        </h2>
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
        {fetchError && (
          <p className={styles.fetchError}>{fetchError}</p>
        )}
        {showEmptyState ? (
          <p className={styles.emptyState}>{emptyStateMessage}</p>
        ) : isMobile ? (
          // Mobile: Simple 2-column grid with all regular products
          (() => {
            const mobileRecords = mobileProducts;
            const rows = [];
            for (let i = 0; i < mobileRecords.length; i += 2) {
              const rowProducts = mobileRecords.slice(i, i + 2);
              rows.push(
                <div key={`mobile-row-${i / 2}`} className={styles.mobileRow}>
                  {rowProducts.map((product) => (
                    <div
                      key={product.id}
                      className={styles.productCard}
                      onClick={() => handleProductClick(product.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className={`${styles.productImage} ${
                          styles[product.size]
                        }`}
                      />
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productPrice}>{product.price}</p>
                    </div>
                  ))}
                </div>
              );
            }
            return rows;
          })()
        ) : (
          // Desktop: Complex grid layout
          <>
            {renderRow(visibleDesktopProducts, 0, "4regular", "row1")}
            {renderRow(visibleDesktopProducts, 4, "2regular1large", "row2")}
            {renderRow(visibleDesktopProducts, 7, "4regular", "row3")}
            {renderRow(visibleDesktopProducts, 11, "1large2regular", "row4")}
            {renderRow(visibleDesktopProducts, 14, "4regular", "row5")}
            {renderRow(visibleDesktopProducts, 18, "2regular1large", "row6")}
            {renderRow(visibleDesktopProducts, 21, "4regular", "row7")}
            {renderRow(visibleDesktopProducts, 25, "4regular", "row8")}
            {renderRow(visibleDesktopProducts, 29, "4regular", "row9")}
            {showExtraGrid && (
              <div className={styles.extraGrid}>
                {extraDesktopProducts.map((product) => (
                  <div
                    key={product.id}
                    className={styles.productCard}
                    onClick={() => handleProductClick(product.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`${styles.productImage} ${styles[product.size]}`}
                    />
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productPrice}>{product.price}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {canShowMore && (
        <div className={styles.seeMoreContainer}>
          <Button
            variant="transparent"
            padding="31px 42px"
            padding768="42px 107px"
            padding350="26px 63px"
            arrow="black"
            onClick={() => setShowAll(true)}
          >
            {t.catalog.seeMore}
          </Button>
        </div>
      )}
    </section>
  );
}
