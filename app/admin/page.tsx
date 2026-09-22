import type { Metadata } from "next";

import AdminScreen from "./AdminScreen";

export const metadata: Metadata = {
  title: "Фотографии сайта — админка TrauMerch",
  // Админка в поиске не нужна ни в каком виде.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminScreen />;
}
