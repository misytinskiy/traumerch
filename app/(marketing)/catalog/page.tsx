import CatalogPage from "../../../features/catalog/CatalogPage";
import type { Metadata } from "next";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Catalog | TrauMerch",
  description:
    "Browse our merchandise catalog and explore product categories and options.",
  openGraph: {
    title: "Catalog | TrauMerch",
    description:
      "Browse our merchandise catalog and explore product categories and options.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Catalog | TrauMerch",
    description:
      "Browse our merchandise catalog and explore product categories and options.",
  },
};

export default function Page() {
  return <CatalogPage />;
}
