"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
import type { NormalizedProduct } from "../../lib/products";
import styles from "./Products.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  isSkeleton?: boolean;
}

const SKELETON_COUNT = 4;

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return response.json();
};

export default function Products({
  initialRecords = [],
}: {
  initialRecords?: NormalizedProduct[];
}) {
  const { t, language } = useLanguage();
  const url = "/api/airtable-products?format=normalized&priceTier=sample&maxRecords=4";
  const { data, error, isLoading } = useSWR(url, fetcher, {
    fallbackData: { records: initialRecords },
    revalidateOnMount: true,
    revalidateIfStale: true,
  });
  const fetchError = error ? t.common.loadProductsError : null;
  const records = data?.records as NormalizedProduct[] | undefined;

  const products = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: SKELETON_COUNT }, (_, index) => ({
        id: `skeleton-${index}`,
        name: "",
        price: "",
        isSkeleton: true,
      }));
    }
    const source = records ?? initialRecords;
    return source.slice(0, 4).map((record) => ({
      id: record.id,
      name: language === "de" ? record.nameDe : record.nameEn,
      price: record.price,
    }));
  }, [records, initialRecords, isLoading, language]);

  const handleProductClick = (productId: string) => {
    // Navigate to design page for the specific product
    window.location.href = `/design?product=${productId}`;
  };

  const handleSeeAllClick = () => {
    // Navigate to catalog page
    window.location.href = "/catalog";
  };

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
        <div
          className={`${styles.productImage} ${
            isSkeleton ? styles.skeletonBlock : ""
          }`}
        />
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

  return (
    <section className={styles.products}>
      <div className={styles.header}>
        <SectionTitle maxWidth={500}>{t.products.title}</SectionTitle>
      </div>

      <div className={styles.grid}>
        {fetchError && <p className={styles.fetchError}>{fetchError}</p>}
        {products.map(renderProductCard)}
      </div>

      <div className={styles.seeAllContainer}>
        <Button
          variant="transparent"
          padding="31px 65px"
          padding1536="20px 48px"
          padding480="24px 48px"
          padding768="41px 76px"
          arrow="black"
          onClick={handleSeeAllClick}
        >
          {t.products.seeAll}
        </Button>
      </div>
    </section>
  );
}
