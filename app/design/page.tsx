"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
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

function getProductNameFromRecord(
  record: AirtableRecord,
  language: "en" | "de"
): string {
  const fields = record.fields || {};
  const nameEng = fields["[WEB] Name ENG"] as string | undefined;
  const nameDe = fields["[WEB] Name DE"] as string | undefined;
  const nameFallback = fields["Name"] as string | undefined;
  return language === "de"
    ? (nameDe || nameEng || nameFallback || "Product")
    : (nameEng || nameDe || nameFallback || "Product");
}

function DesignContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const productId = searchParams.get("product");
  const [productName, setProductName] = useState<string | null>(null);
  const [productRecord, setProductRecord] = useState<AirtableRecord | null>(null);

  const fetchProduct = useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/airtable-products");
        if (!res.ok) return;
        const { records } = await res.json();
        const record = (records as AirtableRecord[] | undefined)?.find(
          (r) => r.id === id
        );
        if (record) {
          setProductName(getProductNameFromRecord(record, language ?? "en"));
          setProductRecord(record);
        } else {
          setProductName(null);
          setProductRecord(null);
        }
      } catch {
        setProductName(null);
        setProductRecord(null);
      }
    },
    [language]
  );

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    } else {
      setProductName(null);
      setProductRecord(null);
    }
  }, [productId, fetchProduct]);

  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main>
        <ProductDetails
          productId={productId ?? undefined}
          productName={productName}
          productRecord={productRecord}
        />

        <Services />

        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default function Design() {
  return (
    <Suspense fallback={<div className={styles.page}><ResponsiveHeader /><main><div className={styles.productDetailsSkeleton} /></main><Footer /></div>}>
      <DesignContent />
    </Suspense>
  );
}
