import InspirationPage from "../../../features/inspiration/InspirationPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inspiration | TrauMerch",
  description:
    "Merch inspiration gallery with custom product ideas, layouts, and branded details.",
  openGraph: {
    title: "Inspiration | TrauMerch",
    description:
      "Merch inspiration gallery with custom product ideas, layouts, and branded details.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Inspiration | TrauMerch",
    description:
      "Merch inspiration gallery with custom product ideas, layouts, and branded details.",
  },
};

export default function Page() {
  return <InspirationPage />;
}
