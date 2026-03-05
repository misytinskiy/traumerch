import PoliciesPage from "../../../features/policies/PoliciesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policies | TrauMerch",
  description:
    "Review our policies and terms for merchandise production and delivery.",
  openGraph: {
    title: "Policies | TrauMerch",
    description:
      "Review our policies and terms for merchandise production and delivery.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Policies | TrauMerch",
    description:
      "Review our policies and terms for merchandise production and delivery.",
  },
};

export default function Page() {
  return <PoliciesPage />;
}
