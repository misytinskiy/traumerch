"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useDeferredValue,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import type { NormalizedProduct } from "../../shared/types";
import { pushDataLayerEvent } from "../../shared/analytics";
import {
  buildDesktopLayoutItems,
  DESKTOP_LAYOUT_PATTERN,
  DESKTOP_ROW_PATTERNS,
  getDesktopLayoutCapacity,
} from "./catalogLayout";
import styles from "./ProductTabs.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  outOfStock: boolean;
  size: "regular" | "large";
  imageUrl: string | null;
  hoverImageUrl: string | null;
  isSkeleton?: boolean;
}

const ALL_PRODUCTS_TAB_KEY = "allProducts";

const MOBILE_SKELETON_COUNT = 12;
const COMPACT_GRID_BREAKPOINT = 900;
const IMAGE_REFRESH_DEBOUNCE_MS = 3000;
const INITIAL_DESKTOP_ROW_COUNT = 9;
const EXPAND_ANIMATION_DURATION = 0.7;

const normalizeCategoryTerm = (value: string) => value.trim().toLowerCase();
const normalizeSearchTerm = (value: string) => value.trim().toLowerCase();

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
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
  const [searchQuery, setSearchQuery] = useState("");
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
  const [activatedHoverImageIds, setActivatedHoverImageIds] = useState<string[]>(
    []
  );
  const hasInitial = initialRecords.length > 0;
  const lastImageRefreshAtRef = useRef(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const allProductsApiUrl = "/api/airtable-products?format=normalized&priceTier=bulk";
  const { data: allProductsData, error, isLoading, mutate } = useSWR(
    allProductsApiUrl,
    fetcher,
    {
      fallbackData: { records: initialRecords },
      revalidateOnMount: initialRecords.length > 0,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const allRecords = (allProductsData?.records ?? initialRecords) as
    | NormalizedProduct[]
    | [];

  useEffect(() => {
    setFailedImageUrls([]);
  }, [allRecords]);

  useEffect(() => {
    setActivatedHoverImageIds([]);
  }, [allRecords, activeTab]);

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
    const seen = new Set<string>();
    const tabs: { key: string; label: string; categoryTerm: string }[] = [];

    for (const record of allRecords) {
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
  }, [allRecords, knownCategoryLabels, language]);

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

  const refreshExpiredImageUrls = useCallback(() => {
    const now = Date.now();
    if (now - lastImageRefreshAtRef.current < IMAGE_REFRESH_DEBOUNCE_MS) {
      return;
    }

    lastImageRefreshAtRef.current = now;
    void mutate();
  }, [mutate]);

  const handleImageError = useCallback(
    (url: string | null) => {
      if (!url) return;

      setFailedImageUrls((current) =>
        current.includes(url) ? current : [...current, url]
      );
      refreshExpiredImageUrls();
    },
    [refreshExpiredImageUrls]
  );

  const handleProductHoverStart = useCallback(
    (product: Product) => {
      if (isMobile || !product.hoverImageUrl || product.isSkeleton) {
        return;
      }

      setActivatedHoverImageIds((current) =>
        current.includes(product.id) ? current : [...current, product.id]
      );
    },
    [isMobile]
  );

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= COMPACT_GRID_BREAKPOINT);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchError = error ? t.common.loadProductsError : null;
  const categoryRecords =
    activeTab === ALL_PRODUCTS_TAB_KEY || !activeCategoryTerm
      ? allRecords
      : allRecords.filter((record) => {
          const categories = Array.isArray(record.categories)
            ? record.categories
            : [];
          return categories.some(
            (category) => normalizeCategoryTerm(category) === activeCategoryTerm
          );
        });
  const normalizedSearchQuery = normalizeSearchTerm(deferredSearchQuery);
  const records = normalizedSearchQuery
    ? categoryRecords.filter((record) => {
        const searchableName = `${record.nameEn} ${record.nameDe}`;
        return normalizeSearchTerm(searchableName).includes(
          normalizedSearchQuery
        );
      })
    : categoryRecords;

  useEffect(() => {
    setShowAll(false);
  }, [records.length, activeTab, normalizedSearchQuery]);

  const activeRecords = records;

  const tabsWithCount = tabs.map((tab) => ({
    ...tab,
    count: tab.key === activeTab ? activeRecords.length : 0,
  }));

  const desktopSkeletonProducts = useMemo<Product[]>(
    () =>
      DESKTOP_LAYOUT_PATTERN.map((size, index) => ({
        id: `skeleton-desktop-${index}`,
        name: "",
        price: "",
        outOfStock: false,
        size,
        imageUrl: null,
        hoverImageUrl: null,
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
        hoverImageUrl: null,
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
        hoverImageUrl: record.hoverImageUrl ?? null,
      };
    },
    [language]
  );

  const buildDesktopProducts = useCallback(
    (sourceRecords: NormalizedProduct[]) => {
      return buildDesktopLayoutItems(sourceRecords).map(({ record, size }) =>
        mapRecordToProduct(record, size)
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

  const shouldShowSkeleton = !hasInitial && isLoading;

  const showEmptyState =
    !shouldShowSkeleton && !fetchError && activeRecords.length === 0;

  const initialDesktopCapacity = getDesktopLayoutCapacity(
    INITIAL_DESKTOP_ROW_COUNT
  );
  const visibleDesktopProducts = desktopProducts.slice(0, initialDesktopCapacity);
  const extraDesktopProducts = desktopProducts.slice(initialDesktopCapacity);
  const canShowMore =
    !shouldShowSkeleton &&
    !isMobile &&
    !showAll &&
    !showEmptyState &&
    desktopProducts.length > initialDesktopCapacity;

  const emptyStateMessage =
    normalizedSearchQuery
      ? t.catalog.search.noResults
      : language === "de"
        ? "In dieser Kategorie gibt es noch keine Produkte."
        : "No products in this category yet.";

  const renderProductCard = (product: Product) => {
    const isSkeleton = Boolean(product.isSkeleton);
    const hasHoverImage =
      !isMobile &&
      Boolean(product.hoverImageUrl) &&
      product.hoverImageUrl !== product.imageUrl;
    const shouldRenderHoverImage =
      hasHoverImage && activatedHoverImageIds.includes(product.id);
    const hasFailedMainImage =
      product.imageUrl !== null && failedImageUrls.includes(product.imageUrl);
    const hasRenderableMainImage = Boolean(product.imageUrl) && !hasFailedMainImage;
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
        onMouseEnter={isSkeleton ? undefined : () => handleProductHoverStart(product)}
        onFocus={isSkeleton ? undefined : () => handleProductHoverStart(product)}
        style={{ cursor: isSkeleton ? "default" : "pointer" }}
      >
        {isSkeleton ? (
          <div
            className={`${styles.productImage} ${styles[product.size]} ${styles.skeletonBlock}`}
          />
        ) : hasRenderableMainImage ? (
          <div className={`${styles.productImage} ${styles[product.size]} ${styles.imageWrap}`}>
            <Image
              src={product.imageUrl as string}
              alt={product.name}
              fill
              sizes={
                product.size === "large"
                  ? "(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                  : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              }
              quality={85}
              className={styles.productImageContent}
              loading="lazy"
              onError={() => handleImageError(product.imageUrl)}
            />
            {shouldRenderHoverImage && (
              <Image
                src={product.hoverImageUrl as string}
                alt={product.name}
                fill
                sizes={
                  product.size === "large"
                    ? "(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                    : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                }
                quality={85}
                className={`${styles.productImageContent} ${styles.productImageHover}`}
                loading="lazy"
                onError={() => handleImageError(product.hoverImageUrl)}
              />
            )}
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

  const renderDesktopRows = (
    sourceProducts: Product[],
    rowOffset = 0,
    keyPrefix = "desktop-row"
  ) => {
    const rows = [];
    let currentIndex = 0;
    let rowIndex = rowOffset;

    while (currentIndex < sourceProducts.length) {
      const rowPattern =
        DESKTOP_ROW_PATTERNS[rowIndex % DESKTOP_ROW_PATTERNS.length];
      const rowProducts = sourceProducts.slice(
        currentIndex,
        currentIndex + rowPattern.sizes.length
      );

      if (!rowProducts.length) {
        break;
      }

      rows.push(
        <div
          key={`${keyPrefix}-${rowIndex}`}
          className={styles[rowPattern.className]}
        >
          {rowProducts.map(renderProductCard)}
        </div>
      );

      currentIndex += rowPattern.sizes.length;
      rowIndex += 1;
    }

    return rows;
  };

  return (
    <section className={styles.tabs}>
      <div className={styles.header}>
        <h2 className={`${styles.title}`}>
          {t.catalog.hero.titleLine1} <br /> {t.catalog.hero.titleLine2}
        </h2>
        <div className={styles.searchWrap}>
          <label className={styles.searchField}>
            <span className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={styles.searchInput}
              placeholder={t.catalog.search.placeholder}
              aria-label={t.catalog.search.placeholder}
            />
            {searchQuery.trim() && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearchQuery("")}
                aria-label={t.catalog.search.clearAria}
              >
                <span aria-hidden="true">+</span>
              </button>
            )}
          </label>
        </div>
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
            renderDesktopRows(desktopSkeletonProducts)
          )
        ) : showEmptyState ? (
          <p className={styles.emptyState}>{emptyStateMessage}</p>
        ) : isMobile ? (
          renderMobileGrid(mobileProducts)
        ) : (
          <>
            {renderDesktopRows(visibleDesktopProducts, 0, "desktop-visible-row")}
            <AnimatePresence initial={false}>
              {showAll && extraDesktopProducts.length > 0 && (
                <motion.div
                  key="catalog-expanded-grid"
                  className={styles.expandedRows}
                  initial={{ height: 0, opacity: 0, y: 28 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    y: 0,
                    transition: {
                      height: {
                        duration: EXPAND_ANIMATION_DURATION,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: { duration: 0.42, ease: "easeOut", delay: 0.08 },
                      y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    y: 18,
                    transition: {
                      height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: 0.2, ease: "easeIn" },
                    },
                  }}
                >
                  <motion.div
                    className={styles.expandedRowsInner}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.08,
                          delayChildren: 0.08,
                        },
                      },
                    }}
                  >
                    {renderDesktopRows(
                      extraDesktopProducts,
                      INITIAL_DESKTOP_ROW_COUNT,
                      "desktop-expanded-row"
                    ).map((row, index) => (
                      <motion.div
                        key={`desktop-expanded-row-motion-${index}`}
                        variants={{
                          hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: {
                              duration: 0.5,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                        }}
                      >
                        {row}
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
