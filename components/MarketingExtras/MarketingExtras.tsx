"use client";

import { usePathname } from "next/navigation";
import GlassBanner from "../GlassBanner/GlassBanner";

export default function MarketingExtras() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <GlassBanner />;
}
