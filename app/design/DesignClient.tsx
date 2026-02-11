"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";
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

export default function DesignClient({
  productId,
  initialRecord,
}: {
  productId?: string | null;
  initialRecord?: AirtableRecord | null;
}) {
  const { language } = useLanguage();

  const productRecord = initialRecord ?? null;
  const productName = useMemo(() => {
    if (!productRecord) return null;
    return getProductNameFromRecord(productRecord, language ?? "en");
  }, [productRecord, language]);

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

export function DesignFallback() {
  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main>
        <div className={styles.productDetailsSkeleton} />
      </main>
      <Footer />
    </div>
  );
}
