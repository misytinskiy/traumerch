import FAQPage from "../../../features/faq/FAQPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | TrauMerch",
  description:
    "Answers to common questions about merchandise production and ordering.",
  openGraph: {
    title: "FAQ | TrauMerch",
    description:
      "Answers to common questions about merchandise production and ordering.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FAQ | TrauMerch",
    description:
      "Answers to common questions about merchandise production and ordering.",
  },
};

export default function Page() {
  return <FAQPage />;
}
