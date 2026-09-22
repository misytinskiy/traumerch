import type { Metadata } from "next";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход — админка TrauMerch",
  // Страница входа в поиске не нужна ни в каком виде.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LoginForm />;
}
