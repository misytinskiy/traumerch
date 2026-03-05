import QuotePage from "../../../features/quote/QuotePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Quote | TrauMerch",
  description:
    "Tell us about your project and receive a tailored merchandise quote.",
  openGraph: {
    title: "Request a Quote | TrauMerch",
    description:
      "Tell us about your project and receive a tailored merchandise quote.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Request a Quote | TrauMerch",
    description:
      "Tell us about your project and receive a tailored merchandise quote.",
  },
};

export default function Page() {
  return <QuotePage />;
}
