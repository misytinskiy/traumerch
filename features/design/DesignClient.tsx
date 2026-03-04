"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import useSWR from "swr";
import { useLanguage } from "../../contexts/LanguageContext";
import { getProductNameFromFields } from "../../shared/product";
import styles from "./design.module.css";

const ProductDetails = dynamic(
  () => import("../../components/ProductDetails/ProductDetails"),
  { ssr: false, loading: () => <div className={styles.productDetailsSkeleton} /> }
);

const Services = dynamic(
  () => import("../../components/Services/Services"),
  { ssr: false }
);

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }
  return response.json();
};

export default function DesignClient({
  productId,
  initialRecord,
}: {
  productId?: string | null;
  initialRecord?: AirtableRecord | null;
}) {
  const { language } = useLanguage();

  const apiUrl = productId
    ? `/api/airtable-products?recordId=${encodeURIComponent(productId)}`
    : null;
  const { data: swrRecord } = useSWR<AirtableRecord | null>(
    apiUrl,
    fetcher,
    {
      fallbackData: initialRecord ?? undefined,
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: true,
    }
  );
  const productRecord = swrRecord ?? initialRecord ?? null;
  const productName = useMemo(() => {
    if (!productRecord) return null;
    return getProductNameFromFields(
      productRecord.fields,
      language ?? "en",
      "Product"
    );
  }, [productRecord, language]);

  return (
    <div className={styles.page}>
      <main>
        <ProductDetails
          productId={productId ?? undefined}
          productName={productName}
          productRecord={productRecord}
        />

        <Services />
      </main>
    </div>
  );
}

export function DesignFallback() {
  return (
    <div className={styles.page}>
      <main>
        <div className={styles.productDetailsSkeleton} />
      </main>
    </div>
  );
}
