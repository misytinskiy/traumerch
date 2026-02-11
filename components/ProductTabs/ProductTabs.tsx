"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import type { NormalizedProduct } from "../../lib/products";
import styles from "./ProductTabs.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  size: "regular" | "large";
  imageUrl: string | null;
  isSkeleton?: boolean;
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

const DESKTOP_LAYOUT_PATTERN: Product["size"][] = [
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "large",
  "regular",
  "regular",
  "regular",
  "regular",
  "large",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "large",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
  "regular",
];

const MOBILE_SKELETON_COUNT = 12;

const TAB_CATEGORY_TERM: Record<TabKey, string | null> = {
  allProducts: null,
  bags: "bags",
  customProduct: "custom product",
  drinkware: "drinkware",
  footwear: "footwear",
  headwear: "headwear",
  homewareAppliances: "homeware appliances",
  wearableAccessories: "wearable accessories",
  wearableTextile: "wearable textile",
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return response.json();
};

export default function ProductTabs({
  initialRecords = [],
}: {
  initialRecords?: NormalizedProduct[];
}) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("allProducts");
  const [isMobile, setIsMobile] = useState(false);
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

  const categoryTerm = TAB_CATEGORY_TERM[activeTab];
  const apiUrl = `/api/airtable-products?format=normalized&priceTier=bulk${
    categoryTerm ? `&category=${encodeURIComponent(categoryTerm)}` : ""
  }`;
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    fallbackData:
      activeTab === "allProducts" ? { records: initialRecords } : undefined,
  });
  const fetchError = error ? t.common.loadProductsError : null;
  const records = (data?.records ?? []) as NormalizedProduct[];

  useEffect(() => {
    setShowAll(false);
  }, [records.length, activeTab]);

  const activeRecords = records;

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
    count: key === activeTab ? activeRecords.length : 0,
  }));

  const initialDesktopCapacity = DESKTOP_LAYOUT_PATTERN.length;

  const desktopSkeletonProducts = useMemo<Product[]>(
    () =>
      DESKTOP_LAYOUT_PATTERN.map((size, index) => ({
        id: `skeleton-desktop-${index}`,
        name: "",
        price: "",
        size,
        imageUrl: null,
        isSkeleton: true,
      })),
    []
  );

  const mobileSkeletonProducts = useMemo<Product[]>(
    () =>
      Array.from({ length: MOBILE_SKELETON_COUNT }, (_, index) => ({
        id: `skeleton-mobile-${index}`,
        name: "",
        price: "",
        size: "regular" as const,
        imageUrl: null,
        isSkeleton: true,
      })),
    []
  );

  const mapRecordToProduct = useCallback(
    (
      record: NormalizedProduct,
      size: "regular" | "large" = "regular"
    ): Product => {
      const name =
        language === "de" ? record.nameDe : record.nameEn;

      return {
        id: record.id,
        name,
        price: record.price,
        size,
        imageUrl: record.imageUrl,
      };
    },
    [language]
  );

  const buildDesktopProducts = useCallback(
    (sourceRecords: NormalizedProduct[]) => {
      const sizes = [...DESKTOP_LAYOUT_PATTERN];
      while (sizes.length < sourceRecords.length) {
        sizes.push("regular");
      }

      return sourceRecords.map((record, index) =>
        mapRecordToProduct(record, sizes[index] ?? "regular")
      );
    },
    [mapRecordToProduct]
  );

  const desktopProducts = useMemo(() => {
    if (!activeRecords.length) {
      return [];
    }

    return buildDesktopProducts(activeRecords);
  }, [activeRecords, buildDesktopProducts]);

  const mobileProducts = useMemo(() => {
    if (!activeRecords.length) {
      return [];
    }

    return activeRecords.map((record) => mapRecordToProduct(record, "regular"));
  }, [activeRecords, mapRecordToProduct]);

  const shouldShowSkeleton = isLoading;

  const showEmptyState =
    !shouldShowSkeleton && !fetchError && activeRecords.length === 0;

  const extraDesktopProducts = useMemo(() => {
    if (!desktopProducts.length || showEmptyState) {
      return [];
    }
    if (desktopProducts.length <= initialDesktopCapacity) {
      return [];
    }
    return desktopProducts.slice(initialDesktopCapacity);
  }, [desktopProducts, initialDesktopCapacity, showEmptyState]);

  const visibleDesktopProducts = useMemo(() => {
    if (!desktopProducts.length || showEmptyState) {
      return [];
    }
    return desktopProducts.slice(0, initialDesktopCapacity);
  }, [desktopProducts, initialDesktopCapacity, showEmptyState]);

  const showExtraGrid =
    !shouldShowSkeleton && showAll && extraDesktopProducts.length > 0;
  const canShowMore =
    !shouldShowSkeleton &&
    !isMobile &&
    !showAll &&
    !showEmptyState &&
    extraDesktopProducts.length > 0;

  const emptyStateMessage =
    language === "de"
      ? "In dieser Kategorie gibt es noch keine Produkte."
      : "No products in this category yet.";

  const renderProductCard = (product: Product) => {
    const isSkeleton = Boolean(product.isSkeleton);
    const priceText = (() => {
      const raw = product.price?.trim() || "";
      if (!raw) return "";
      if (language === "de") {
        if (/^ab\b/i.test(raw)) return raw;
        const cleaned = raw.replace(/^from\s+/i, "");
        return `Ab ${cleaned}`;
      }
      if (/^from\b/i.test(raw)) return raw;
      const cleaned = raw.replace(/^ab\s+/i, "");
      return `From ${cleaned}`;
    })();

    return (
      <div
        key={product.id}
        className={`${styles.productCard} ${
          isSkeleton ? styles.skeletonCard : ""
        }`}
        onClick={isSkeleton ? undefined : () => handleProductClick(product.id)}
        style={{ cursor: isSkeleton ? "default" : "pointer" }}
      >
        {isSkeleton ? (
          <div
            className={`${styles.productImage} ${styles[product.size]} ${styles.skeletonBlock}`}
          />
        ) : product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className={`${styles.productImage} ${styles[product.size]}`}
          />
        ) : (
          <div
            className={`${styles.productImage} ${styles[product.size]}`}
            style={{ background: "rgba(200, 200, 200, 1)" }}
          />
        )}
        {isSkeleton ? (
          <>
            <div className={`${styles.skeletonText} ${styles.long}`} />
            <div className={`${styles.skeletonText} ${styles.short}`} />
          </>
        ) : (
          <>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{priceText}</p>
          </>
        )}
      </div>
    );
  };

  const renderMobileGrid = (products: Product[]) => {
    const rows = [];
    for (let i = 0; i < products.length; i += 2) {
      const rowProducts = products.slice(i, i + 2);
      rows.push(
        <div key={`mobile-row-${i / 2}`} className={styles.mobileRow}>
          {rowProducts.map(renderProductCard)}
        </div>
      );
    }
    return rows;
  };

  const renderRow = (
    sourceProducts: Product[],
    startIndex: number,
    pattern: string,
    rowClass: string
  ) => {
    const currentIndex = startIndex;
    const rowProducts: Product[] = [];

    if (pattern === "4regular") {
      rowProducts.push(...sourceProducts.slice(currentIndex, currentIndex + 4));
    } else if (pattern === "2regular1large") {
      rowProducts.push(...sourceProducts.slice(currentIndex, currentIndex + 3));
    } else if (pattern === "1large2regular") {
      rowProducts.push(...sourceProducts.slice(currentIndex, currentIndex + 3));
    }

    return (
      <div key={rowClass} className={styles[rowClass]}>
        {rowProducts.map(renderProductCard)}
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
        {fetchError && <p className={styles.fetchError}>{fetchError}</p>}
        {shouldShowSkeleton ? (
          isMobile ? (
            renderMobileGrid(mobileSkeletonProducts)
          ) : (
            <>
              {renderRow(desktopSkeletonProducts, 0, "4regular", "row1")}
              {renderRow(desktopSkeletonProducts, 4, "2regular1large", "row2")}
              {renderRow(desktopSkeletonProducts, 7, "4regular", "row3")}
              {renderRow(desktopSkeletonProducts, 11, "1large2regular", "row4")}
              {renderRow(desktopSkeletonProducts, 14, "4regular", "row5")}
              {renderRow(desktopSkeletonProducts, 18, "2regular1large", "row6")}
              {renderRow(desktopSkeletonProducts, 21, "4regular", "row7")}
              {renderRow(desktopSkeletonProducts, 25, "4regular", "row8")}
              {renderRow(desktopSkeletonProducts, 29, "4regular", "row9")}
            </>
          )
        ) : showEmptyState ? (
          <p className={styles.emptyState}>{emptyStateMessage}</p>
        ) : isMobile ? (
          renderMobileGrid(mobileProducts)
        ) : (
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
                {extraDesktopProducts.map(renderProductCard)}
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
