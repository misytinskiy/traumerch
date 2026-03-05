import SolutionsPage from "../../../features/solutions/SolutionsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions | TrauMerch",
  description:
    "Merchandise solutions tailored for campaigns, onboarding, gifting, and teams.",
  openGraph: {
    title: "Solutions | TrauMerch",
    description:
      "Merchandise solutions tailored for campaigns, onboarding, gifting, and teams.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Solutions | TrauMerch",
    description:
      "Merchandise solutions tailored for campaigns, onboarding, gifting, and teams.",
  },
};

export default function Page() {
  return <SolutionsPage />;
}
