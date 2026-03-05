import DesignPage from "../../../features/design/DesignPage";
import type { Metadata } from "next";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Design | TrauMerch",
  description:
    "Explore product details and customize merchandise to your brand.",
  openGraph: {
    title: "Design | TrauMerch",
    description:
      "Explore product details and customize merchandise to your brand.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Design | TrauMerch",
    description:
      "Explore product details and customize merchandise to your brand.",
  },
};

export default function Page(props: { searchParams?: Promise<{ product?: string }> }) {
  return <DesignPage {...props} />;
}
