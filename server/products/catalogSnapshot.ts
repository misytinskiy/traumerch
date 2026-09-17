import "server-only";

import { unstable_cache } from "next/cache";

import { fetchNormalizedProducts } from "./products";
import type { ClientProduct, NormalizedProduct } from "../../shared/types";

/**
 * Снимок каталога.
 *
 * Раньше каждый заход на /catalog ходил в Airtable: три вызова на рендер
 * страницы плюс три на клиентскую ревалидацию. Расход рос линейно с трафиком
 * и на тарифе Team (100 000 вызовов в месяц на воркспейс) упирался в потолок
 * примерно на 550 заходах в сутки.
 *
 * Теперь результат кешируется целиком и общий для всех посетителей: три вызова
 * раз в CATALOG_TTL_SECONDS независимо от того, сколько человек открыло
 * страницу. Кешируется именно нормализованный результат, а не отдельные
 * HTTP-запросы: у страниц Airtable в URL лежит offset, который меняется при
 * каждом обновлении данных, поэтому покешировать их по URL не вышло бы.
 */

export const CATALOG_TTL_SECONDS = 300;
export const CATALOG_CACHE_TAG = "catalog";

type PriceTier = "sample" | "bulk";

export type CatalogSnapshot = {
  records: NormalizedProduct[];
  /** Когда снимок был собран. */
  fetchedAt: number;
  /** true, если Airtable не ответил и отдан предыдущий удачный снимок. */
  stale: boolean;
};

/**
 * Последний удачный ответ на этот инстанс. Страховка на случай, когда Airtable
 * отвечает ошибкой или 429 ровно в момент обновления кеша: лучше отдать вчерашние
 * цены, чем пустой каталог. Кеш Next при неудачной ревалидации обычно сам
 * оставляет прошлое значение, но полагаться на одну защиту здесь не хочется —
 * пустой каталог это то, чего мы пытаемся избежать в первую очередь.
 */
const lastGood = new Map<string, CatalogSnapshot>();

const snapshotKey = (priceTier: PriceTier, view?: string) =>
  `${priceTier}:${view ?? "default"}`;

/**
 * Токен читается внутри, а не приходит аргументом: unstable_cache включает
 * аргументы функции в ключ кеша. Смена токена давала бы промах мимо кеша —
 * и ровно в тот момент, когда с токеном что-то не так, каталог оказывался бы
 * пустым вместо того, чтобы отдаться из кеша. Плюс секрету в ключе кеша не место.
 *
 * Бросает исключение при неудаче намеренно: так в кеш не попадёт пустой список,
 * а Next оставит предыдущее значение и продолжит отдавать его.
 */
const loadSnapshot = async (
  priceTier: PriceTier,
  view: string | undefined
): Promise<CatalogSnapshot> => {
  const apiToken = process.env.API_TOKEN;
  if (!apiToken) {
    throw new Error("Missing API_TOKEN");
  }

  const { records } = await fetchNormalizedProducts({
    apiToken,
    priceTier,
    view,
  });

  if (records.length === 0) {
    throw new Error("Airtable вернул пустой каталог — не кешируем");
  }

  return { records, fetchedAt: Date.now(), stale: false };
};

const cachedSnapshot = (priceTier: PriceTier, view: string | undefined) =>
  unstable_cache(
    async () => loadSnapshot(priceTier, view),
    ["catalog-snapshot", priceTier, view ?? "default"],
    { revalidate: CATALOG_TTL_SECONDS, tags: [CATALOG_CACHE_TAG] }
  );

/**
 * Каталог для страницы и для API. Никогда не бросает исключение: если Airtable
 * недоступен и прошлого снимка нет, вернётся пустой список, а вызывающий код
 * сам решит, что показать.
 */
export const getCatalogSnapshot = async ({
  priceTier,
  view,
}: {
  priceTier: PriceTier;
  view?: string;
}): Promise<CatalogSnapshot> => {
  const key = snapshotKey(priceTier, view);

  try {
    const snapshot = await cachedSnapshot(priceTier, view)();
    if (snapshot.records.length > 0) {
      lastGood.set(key, snapshot);
    }
    return snapshot;
  } catch (error) {
    const previous = lastGood.get(key);
    console.error(
      `[catalog] Airtable недоступен, отдаём ${previous ? "прошлый снимок" : "пустой каталог"}`,
      error
    );
    return previous
      ? { ...previous, stale: true }
      : { records: [], fetchedAt: 0, stale: true };
  }
};

/**
 * Версия записей для браузера.
 *
 * Сырые ссылки Airtable нужны только серверу — по ним /api/product-photo
 * забирает байты. В разметку они попадать не должны: живут два часа, ничего
 * не рендерят и тянут за собой лишнюю сотню килобайт на страницу.
 * Клиенту достаточно id вложений, из которых строятся вечные адреса.
 */
export const stripPhotoUrls = (records: NormalizedProduct[]): ClientProduct[] =>
  records.map(({
    imageUrl: _imageUrl,
    hoverImageUrl: _hoverImageUrl,
    imageUrlSmall: _small,
    imageUrlLarge: _large,
    imageUrlFull: _full,
    ...rest
  }) => rest);
