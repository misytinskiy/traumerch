import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import ProductTabs from "../../components/ProductTabs/ProductTabs";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import styles from "./catalog.module.css";
import { fetchNormalizedProducts } from "../../lib/products";

export const revalidate = 300;

export default async function Catalog() {
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
          revalidateSeconds: 300,
        })
      ).records;
    } catch {
      initialRecords = [];
    }
  }
  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main>
        {/* Product catalog with tabs and title */}
        <ProductTabs initialRecords={initialRecords} />

        {/* CTA section */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
