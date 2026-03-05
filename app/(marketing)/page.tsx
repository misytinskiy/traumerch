import HomePage from "../../features/home/HomePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrauMerch - Merchandise Solutions",
  description:
    "Unleashing your brand through merchandise that truly connects with your audience.",
  openGraph: {
    title: "TrauMerch - Merchandise Solutions",
    description:
      "Unleashing your brand through merchandise that truly connects with your audience.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TrauMerch - Merchandise Solutions",
    description:
      "Unleashing your brand through merchandise that truly connects with your audience.",
  },
};

export default function Page() {
  return <HomePage />;
}
