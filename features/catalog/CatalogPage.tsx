import ProductTabs from "../../components/ProductTabs/ProductTabs";
import styles from "./catalog.module.css";
import { getCatalogSnapshot } from "../../server/products/catalogSnapshot";

export default async function CatalogPage() {
  // Снимок общий для всех посетителей и живёт CATALOG_TTL_SECONDS,
  // поэтому Airtable дёргается раз в пять минут, а не на каждый заход.
  // getCatalogSnapshot не бросает исключений: при недоступности Airtable
  // вернётся прошлый удачный снимок или пустой список.
  const { records } = await getCatalogSnapshot({
    priceTier: "bulk",
    view: process.env.AIRTABLE_CATALOG_VIEW_ID || undefined,
  });

  return (
    <div className={styles.page}>
      <main>
        {/* Product catalog with tabs and title */}
        <ProductTabs initialRecords={records} />
      </main>
    </div>
  );
}
