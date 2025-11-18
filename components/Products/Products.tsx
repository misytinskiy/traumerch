"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
import styles from "./Products.module.css";

interface Product {
  id: string;
  name: string;
  price: string;
  isSkeleton?: boolean;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

const SKELETON_COUNT = 4;

export default function Products() {
  const { t } = useLanguage();
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, []);

  const mapRecordToProduct = (record: AirtableRecord): Product => {
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
    };
  };

  const products = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: SKELETON_COUNT }, (_, index) => ({
        id: `skeleton-${index}`,
        name: "",
        price: "",
        isSkeleton: true,
      }));
    }
    return records.slice(0, 4).map(mapRecordToProduct);
  }, [records, isLoading]);

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
          padding350="26px 49px"
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
