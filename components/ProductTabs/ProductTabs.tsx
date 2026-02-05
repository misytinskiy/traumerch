"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./ProductTabs.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  size: "regular" | "large";
  imageUrl: string | null;
  isSkeleton?: boolean;
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

  const activeRecords = useMemo(
    () => categorizedRecords[activeTab] ?? [],
    [categorizedRecords, activeTab]
  );

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
      record: AirtableRecord,
      size: "regular" | "large" = "regular"
    ): Product => {
      const fields = record.fields || {};
      const nameEng = fields["[WEB] Name ENG"] as string | undefined;
      const nameDe = fields["[WEB] Name DE"] as string | undefined;
      const nameFallback = fields["Name"] as string | undefined;
      const name =
        language === "de"
          ? (nameDe || nameEng || nameFallback || "Product")
          : (nameEng || nameDe || nameFallback || "Product");

      const sampleSalesValue =
        fields["1-24 pcs (Sample) | SALES"] ??
        fields["Price"] ??
        (fields["[WEB] Price"] as string | undefined);
      const price =
        typeof sampleSalesValue === "number"
          ? `From €${sampleSalesValue}`
          : typeof sampleSalesValue === "string" && sampleSalesValue.trim()
            ? sampleSalesValue.startsWith("€")
              ? sampleSalesValue
              : `From €${sampleSalesValue}`
            : "From €6";

      const mainPhoto = fields["Main Product Photo"];
      const mainPhotoArr = Array.isArray(mainPhoto) ? mainPhoto : [];
      const firstAttachment = mainPhotoArr[0];
      const imageUrl =
        firstAttachment &&
        typeof firstAttachment === "object" &&
        firstAttachment !== null &&
        "url" in firstAttachment &&
        typeof (firstAttachment as { url?: string }).url === "string"
          ? (firstAttachment as { url: string }).url
          : null;

      return {
        id: record.id,
        name,
        price,
        size,
        imageUrl,
      };
    },
    [language]
  );

  const buildDesktopProducts = useCallback(
    (sourceRecords: AirtableRecord[]) => {
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

  const shouldShowSkeleton = isLoadingRecords;

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
            <p className={styles.productPrice}>{product.price}</p>
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
