import ProductTabs from "../../components/ProductTabs/ProductTabs";
import styles from "./catalog.module.css";
import { fetchNormalizedProducts } from "../../server/products/products";
import { unstable_cache } from "next/cache";

const getCachedCatalogRecords = unstable_cache(
  async () => {
    const apiToken = process.env.API_TOKEN;
    const catalogViewId = process.env.AIRTABLE_CATALOG_VIEW_ID;

    if (!apiToken) return [];

    return (
      await fetchNormalizedProducts({
        apiToken,
        priceTier: "bulk",
        view: catalogViewId || undefined,
      })
    ).records;
  },
  ["catalog-records-bulk-hover-image-v2"],
  { revalidate: 300 }
);

export default async function CatalogPage() {
  let initialRecords = [] as Awaited<
    ReturnType<typeof fetchNormalizedProducts>
  >["records"];
  try {
    initialRecords = await getCachedCatalogRecords();
  } catch (error) {
    console.error("[CatalogPage] Failed to fetch initial records", error);
    initialRecords = [];
  }
  return (
    <div className={styles.page}>
      <main>
        {/* Product catalog with tabs and title */}
        <ProductTabs initialRecords={initialRecords} />

      </main>
    </div>
  );
}
