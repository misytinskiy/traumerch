import type { Metadata } from "next";
import ConfLandingPage from "../../features/conf/ConfLandingPage";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.traumerch.com"
).replace(/\/$/, "");

export const metadata: Metadata = {
  title: "TrauMerch · GGATE26 Conference",
  description:
    "Custom branded merchandise for the GGATE26 conference — produced on demand and delivered fast.",
  alternates: {
    canonical: `${siteUrl}/conf`,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "TrauMerch · GGATE26 Conference",
    description:
      "Custom branded merchandise for the GGATE26 conference — produced on demand and delivered fast.",
    url: `${siteUrl}/conf`,
    type: "website",
  },
};

export default function Page() {
  return <ConfLandingPage />;
}
