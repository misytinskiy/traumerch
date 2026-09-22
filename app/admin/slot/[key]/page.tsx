import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SLOTS, getSlot } from "../../../../content/slots";
import { neededWidth } from "../../_lib/neededWidth.server";
import SlotEditor from "./SlotEditor";

/**
 * Экран одного места на сайте.
 *
 * Список ключей известен на сборке, поэтому страницы разворачиваются заранее и
 * остаются статическими — как и весь остальной сайт. Содержимое черновика
 * подтягивается уже из браузера: иначе страница стала бы динамической и
 * потребовала бы токен GitHub на сборке.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return SLOTS.map((slot) => ({ key: slot.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const slot = getSlot(key);
  return {
    title: slot ? `${slot.label} — админка TrauMerch` : "Админка TrauMerch",
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const slot = getSlot(key);
  if (!slot) notFound();

  return (
    <SlotEditor
      slot={{
        key: slot.key,
        label: slot.label,
        group: slot.group,
        page: slot.page,
        shape: slot.shape,
        mobileShape: slot.mobileShape ?? null,
      }}
      // Считается на сервере через тот же targetWidths, которым пользуется
      // конвейер: копия формулы в браузере разошлась бы с реальностью.
      neededWidth={neededWidth(slot)}
    />
  );
}
