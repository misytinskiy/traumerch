import PortfolioPage from "../../../features/portfolio/PortfolioPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio | TrauMerch",
  description:
    "Selected merchandise projects showcasing craftsmanship, branding, and detail.",
  openGraph: {
    title: "Portfolio | TrauMerch",
    description:
      "Selected merchandise projects showcasing craftsmanship, branding, and detail.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Portfolio | TrauMerch",
    description:
      "Selected merchandise projects showcasing craftsmanship, branding, and detail.",
  },
};

export default function Page() {
  return <PortfolioPage />;
}
