"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import type { NormalizedProduct } from "../../shared/types";
import { pushDataLayerEvent } from "../../shared/analytics";
import styles from "./ProductTabs.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  outOfStock: boolean;
  size: "regular" | "large";
  imageUrl: string | null;
  isSkeleton?: boolean;
}

const ALL_PRODUCTS_TAB_KEY = "allProducts";

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
const COMPACT_GRID_BREAKPOINT = 900;

const normalizeCategoryTerm = (value: string) => value.trim().toLowerCase();

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(ALL_PRODUCTS_TAB_KEY);
  const [isMobile, setIsMobile] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const hasInitial = initialRecords.length > 0;
  const allProductsApiUrl = "/api/airtable-products?format=normalized&priceTier=bulk";
  const { data: allProductsData } = useSWR(
    allProductsApiUrl,
    fetcher,
    {
      fallbackData: hasInitial ? { records: initialRecords } : undefined,
      revalidateOnMount: !hasInitial,
      revalidateIfStale: true,
    }
  );

  const knownCategoryLabels = useMemo(
    () => ({
      bags: t.catalog.tabs.bags,
      "custom product": t.catalog.tabs.customProduct,
      drinkware: t.catalog.tabs.drinkware,
      footwear: t.catalog.tabs.footwear,
      headwear: t.catalog.tabs.headwear,
      "homeware appliances": t.catalog.tabs.homewareAppliances,
      "wearable accessories": t.catalog.tabs.wearableAccessories,
      "wearable textile": t.catalog.tabs.wearableTextile,
    }),
    [t]
  );

  const dynamicCategoryTabs = useMemo(() => {
    const records = (allProductsData?.records ?? []) as NormalizedProduct[];
    const seen = new Set<string>();
    const tabs: { key: string; label: string; categoryTerm: string }[] = [];

    for (const record of records) {
      const categories = Array.isArray(record.categories) ? record.categories : [];
      for (const category of categories) {
        const normalized = normalizeCategoryTerm(category);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        tabs.push({
          key: normalized,
          label: knownCategoryLabels[normalized as keyof typeof knownCategoryLabels] || category,
          categoryTerm: normalized,
        });
      }
    }

    tabs.sort((a, b) =>
      a.label.localeCompare(b.label, language === "de" ? "de" : "en", {
        sensitivity: "base",
      })
    );

    return tabs;
  }, [allProductsData?.records, knownCategoryLabels, language]);

  const tabs = useMemo(
    () => [
      {
        key: ALL_PRODUCTS_TAB_KEY,
        label: t.catalog.tabs.allProducts,
        categoryTerm: null,
      },
      ...dynamicCategoryTabs,
    ],
    [dynamicCategoryTabs, t.catalog.tabs.allProducts]
  );

  useEffect(() => {
    if (tabs.some((tab) => tab.key === activeTab)) return;
    setActiveTab(ALL_PRODUCTS_TAB_KEY);
  }, [tabs, activeTab]);

  const activeCategoryTerm =
    tabs.find((tab) => tab.key === activeTab)?.categoryTerm ?? null;

  const handleProductClick = (productId: string) => {
    pushDataLayerEvent("catalog_product_select", {
      product_id: productId,
      category: activeCategoryTerm ?? "all_products",
    });
    // Navigate to design page for the specific product
    router.push(`/design?product=${productId}`);
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= COMPACT_GRID_BREAKPOINT);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const apiUrl = `/api/airtable-products?format=normalized&priceTier=bulk${
    activeCategoryTerm ? `&category=${encodeURIComponent(activeCategoryTerm)}` : ""
  }`;
  const shouldFetch = activeTab !== ALL_PRODUCTS_TAB_KEY || !hasInitial;
  const { data, error, isLoading } = useSWR(shouldFetch ? apiUrl : null, fetcher, {
    fallbackData:
      activeTab === ALL_PRODUCTS_TAB_KEY && hasInitial
        ? { records: initialRecords }
        : undefined,
    revalidateOnMount: false,
    revalidateIfStale: true,
  });
  const fetchError = error ? t.common.loadProductsError : null;
  const records = (
    activeTab === ALL_PRODUCTS_TAB_KEY
      ? hasInitial
        ? initialRecords
        : data?.records ?? []
      : data?.records ?? []
  ) as NormalizedProduct[];

  useEffect(() => {
    setShowAll(false);
  }, [records.length, activeTab]);

  const activeRecords = records;

  const tabsWithCount = tabs.map((tab) => ({
    ...tab,
    count: tab.key === activeTab ? activeRecords.length : 0,
  }));

  const initialDesktopCapacity = DESKTOP_LAYOUT_PATTERN.length;

  const desktopSkeletonProducts = useMemo<Product[]>(
    () =>
      DESKTOP_LAYOUT_PATTERN.map((size, index) => ({
        id: `skeleton-desktop-${index}`,
        name: "",
        price: "",
        outOfStock: false,
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
        outOfStock: false,
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
      const imageUrl =
        size === "large"
          ? record.imageUrlFull ??
            record.imageUrlLarge ??
            record.imageUrlSmall ??
            record.imageUrl
          : record.imageUrlLarge ??
            record.imageUrlSmall ??
            record.imageUrlFull ??
            record.imageUrl;

      return {
        id: record.id,
        name,
        price: record.price,
        outOfStock: record.outOfStock,
        size,
        imageUrl,
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

  const shouldShowSkeleton = shouldFetch && isLoading;

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
      if (product.outOfStock) {
        return "Out of stock";
      }
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
          <div className={`${styles.productImage} ${styles[product.size]} ${styles.imageWrap}`}>
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes={
                product.size === "large"
                  ? "(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                  : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              }
              quality={100}
              unoptimized
              className={styles.productImageContent}
              loading="lazy"
            />
          </div>
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

    if (rowProducts.length === 0) {
      return null;
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
        {tabsWithCount.map((tab) => (
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
