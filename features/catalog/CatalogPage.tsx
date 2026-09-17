import ProductTabs from "../../components/ProductTabs/ProductTabs";
import styles from "./catalog.module.css";
import {
  getCatalogSnapshot,
  stripPhotoUrls,
} from "../../server/products/catalogSnapshot";

export default async function CatalogPage() {
  // Снимок общий для всех посетителей и живёт CATALOG_TTL_SECONDS,
  // поэтому Airtable дёргается раз в пять минут, а не на каждый заход.
  // getCatalogSnapshot не бросает исключений: при недоступности Airtable
  // вернётся прошлый удачный снимок или пустой список.
  const { records } = await getCatalogSnapshot({
    priceTier: "bulk",
    view: process.env.AIRTABLE_CATALOG_VIEW_ID || undefined,
  });

  // Страница пререндерится на сборке, а getCatalogSnapshot намеренно не бросает
  // исключений — при недоступном Airtable он отдаёт пустой список. Вместе это
  // означало, что неудачный запрос на билде запекался в статическую страницу:
  // деплой проходил успешно, а каталог уезжал в прод пустым и оставался таким
  // до следующей ревалидации. Наблюдалось примерно на каждой второй сборке.
  //
  // Упасть на сборке здесь правильнее: провалившийся деплой чинится повтором,
  // выкаченный пустой каталог — нет.
  if (records.length === 0 && process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Каталог пуст на сборке: Airtable не ответил. Прерываем сборку, чтобы не " +
        "выкатить пустую страницу. Повторите деплой."
    );
  }

  return (
    <div className={styles.page}>
      <main>
        {/* Product catalog with tabs and title */}
        <ProductTabs initialRecords={stripPhotoUrls(records)} />
      </main>
    </div>
  );
}
