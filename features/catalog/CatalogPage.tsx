import ProductTabs from "../../components/ProductTabs/ProductTabs";
import styles from "./catalog.module.css";
import { fetchNormalizedProducts } from "../../server/products/products";

export default async function CatalogPage() {
  const apiToken = process.env.API_TOKEN;
  let initialRecords = [] as Awaited<
    ReturnType<typeof fetchNormalizedProducts>
  >["records"];
  if (apiToken) {
    try {
      initialRecords = (
        await fetchNormalizedProducts({
          apiToken,
          priceTier: "bulk",
        })
      ).records;
    } catch {
      initialRecords = [];
    }
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
