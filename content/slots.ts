/**
 * Реестр всех управляемых фотографий сайта.
 *
 * Это единственный источник правды о том, какие изображения на сайте можно
 * заменить через админку. Из него строится список в /admin, и по нему
 * scripts/optimize-media.mjs переносит текущие файлы в public/media.
 *
 * Добавление слота = добавить запись сюда + поставить <MediaImage slot="..." />
 * в нужное место разметки. Ничего больше.
 */

export type SlotShape = {
  /** Ширина в условных единицах — для расчёта пропорций превью. */
  w: number;
  /** Высота в тех же единицах. */
  h: number;
};

export type Slot = {
  /** Стабильный ключ. Меняться не должен — на него ссылается media.json. */
  key: string;
  /** Подпись в админке. */
  label: string;
  /** Группа в админке. */
  group: SlotGroup;
  /**
   * Текущий путь в /public. Используется один раз, при миграции:
   * скрипт оптимизации берёт этот файл как исходник для слота.
   * После миграции поле остаётся как справка о происхождении.
   */
  legacy: string;
  /** Пропорции места на десктопе. */
  shape: SlotShape;
  /** Пропорции на мобильном, если заметно отличаются. */
  mobileShape?: SlotShape;
  /** Значение атрибута sizes для srcset. */
  sizes: string;
  /** alt по умолчанию. Для локализованных блоков переопределяется пропом. */
  alt: string;
  /** Логотипы и иконки нельзя ресайзить как фото — жмём без изменения размера. */
  kind?: "photo" | "logo";
};

export const SLOT_GROUPS = [
  "Заставка",
  "Главная",
  "Главная / Решения",
  "Решения",
  "Inspiration",
  "Portfolio",
  "Товар",
  "Лендинг /conf",
] as const;

export type SlotGroup = (typeof SLOT_GROUPS)[number];

/* ------------------------------------------------------------------ *
 * Сетка Inspiration: 4 колонки, ряды по 350px, gap 20px.
 * Пропорции плитки считаем от номинального контейнера 1280px.
 * ------------------------------------------------------------------ */

const GRID_CONTAINER = 1280;
const GRID_GAP = 20;
const GRID_ROW = 350;
const GRID_COL = (GRID_CONTAINER - GRID_GAP * 3) / 4;

const tileShape = (cols: number, rows: number): SlotShape => ({
  w: Math.round(cols * GRID_COL + (cols - 1) * GRID_GAP),
  h: rows * GRID_ROW + (rows - 1) * GRID_GAP,
});

/** [номер файла, колонок, рядов, alt] — порядок как в разметке страницы. */
const INSPIRATION_TILES: ReadonlyArray<[number, number, number, string]> = [
  [1, 1, 1, "Branded cap with pencil"],
  [2, 1, 1, "Branded tag"],
  [4, 1, 1, "Earbuds case"],
  [3, 2, 2, "Branded brush"],
  [5, 1, 1, "Inspiration photo 5"],
  [6, 1, 1, "Inspiration photo 6"],
  [7, 2, 2, "Inspiration photo 7"],
  [8, 1, 1, "Inspiration photo 8"],
  [9, 1, 1, "Inspiration photo 9"],
  [10, 2, 1, "Inspiration photo 10"],
  [11, 1, 1, "Inspiration photo 11"],
  [12, 2, 2, "Inspiration photo 12"],
  [13, 2, 1, "Inspiration photo 13"],
  [14, 2, 1, "Inspiration photo 14"],
  [15, 1, 1, "Inspiration photo 15"],
  [16, 2, 1, "Inspiration photo 16"],
  [17, 1, 1, "Inspiration photo 17"],
  [18, 2, 1, "Inspiration photo 18"],
  [19, 1, 1, "Inspiration photo 19"],
  [20, 1, 2, "Inspiration photo 20"],
  [21, 2, 1, "Inspiration photo 21"],
  [22, 1, 2, "Inspiration photo 22"],
  [23, 1, 2, "Inspiration photo 23"],
  [24, 1, 1, "Inspiration photo 24"],
  [25, 1, 1, "Inspiration photo 25"],
  [26, 1, 1, "Inspiration photo 26"],
  [27, 1, 1, "Inspiration photo 27"],
  [28, 1, 1, "Inspiration photo 28"],
  [29, 1, 1, "Inspiration photo 29"],
  [30, 2, 1, "Inspiration photo 30"],
  [31, 2, 1, "Inspiration photo 31"],
  [32, 1, 1, "Inspiration photo 32"],
  [33, 1, 2, "Inspiration photo 33"],
  [34, 3, 2, "Inspiration photo 34"],
];

/* ------------------------------------------------------------------ */

const preloader: Slot[] = [1, 2, 3].map((n) => ({
  key: `preloader.${n}`,
  label: `Заставка — кадр ${n}`,
  group: "Заставка",
  legacy: `/preloader/${n}.jpg`,
  shape: { w: 900, h: 1200 },
  sizes: "(max-width: 900px) 100vw, 33vw",
  alt: `Preloader image ${n}`,
}));

const homeHero: Slot[] = [
  { n: 1, file: "/heroSliderPhoto/1.JPEG" },
  { n: 2, file: "/heroSliderPhoto/2.JPEG" },
  { n: 3, file: "/heroSliderPhoto/3.JPEG" },
].map(({ n, file }) => ({
  key: `home.hero.${n}`,
  label: `Главная — первый экран, слайд ${n}`,
  group: "Главная",
  legacy: file,
  shape: { w: 1920, h: 1080 },
  mobileShape: { w: 390, h: 620 },
  sizes: "100vw",
  alt: `Hero slide ${n}`,
}));

const logos: Slot[] = [
  ["gGateConf", "G Gate Conf"],
  ["kicks", "Kicks Vienna"],
  ["retal", "RETAL"],
  ["umiz", "UMIZ"],
  ["octoClick", "OctoClick"],
  ["semmering", "Sporthotel am Semmering"],
  ["lisa", "LISA"],
  ["vic", "VIC"],
].map(([file, name]) => ({
  key: `logos.${file}`,
  label: `Логотип клиента — ${name}`,
  group: "Главная",
  legacy: `/logo/${file}.webp`,
  shape: { w: 200, h: 80 },
  sizes: "160px",
  alt: name,
  kind: "logo" as const,
}));

const homeGallery: Slot[] = [1, 2, 3, 4, 5].map((n) => ({
  key: `home.gallery.${n}`,
  label: `Главная — отзывы, карточка ${n}`,
  group: "Главная",
  legacy: `/gallery/${n}.jpg`,
  shape: { w: 800, h: 1000 },
  sizes: "(max-width: 900px) 80vw, 33vw",
  alt: `Gallery image ${n}`,
}));

const homeGalleryPlaceholder: Slot[] = [
  {
    key: "home.gallery.placeholder",
    label: "Главная — отзывы, заглушка для мобильного",
    group: "Главная",
    legacy: "/gallery/placeholder.jpg",
    shape: { w: 800, h: 1000 },
    sizes: "100vw",
    alt: "Gallery placeholder",
  },
];

const promises: Slot[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  key: `promises.${n}`,
  label: `Главная — преимущества, блок ${n}`,
  group: "Главная",
  legacy: `/promises/${n}.png`,
  shape: { w: 1200, h: 564 },
  sizes: "(max-width: 900px) 100vw, 50vw",
  alt: `Promise ${n}`,
}));

const team: Slot[] = [
  ["ihor", "Ihor"],
  ["ivan", "Ivan"],
  ["yury", "Yury"],
  ["mathias", "Mathias"],
  ["anna-valeriia", "Anna-Valeriia"],
  ["lea", "Lea"],
].map(([slug, name]) => ({
  key: `team.${slug}`,
  label: `Команда — ${name}`,
  group: "Главная",
  legacy: `/ourTeam/${slug}.png`,
  shape: { w: 600, h: 750 },
  sizes: "(max-width: 900px) 50vw, 25vw",
  alt: `Portrait of ${name}`,
}));

/** Услуги показываются и на главной (первые 3), и на /solutions (все 5). */
const servicesMain: Slot[] = [1, 2, 3, 4, 5].map((n) => ({
  key: `services.${n}.main`,
  label: `Услуга ${n} — крупное фото`,
  group: "Главная / Решения",
  legacy: `/services/${n}.png`,
  shape: { w: 1200, h: 1020 },
  sizes: "(max-width: 900px) 100vw, (max-width: 1280px) 50vw, 40vw",
  alt: `Service ${n}`,
}));

/** Мозаика из трёх фото под каждой услугой — только на мобильном. */
const SERVICE_MOSAIC: ReadonlyArray<readonly [number, readonly string[]]> = [
  [1, ["/services/1/1.jpg", "/services/1/2.jpg", "/services/1/5.jpg"]],
  [2, ["/services/2/1.jpg", "/services/2/2.jpg", "/services/2/3.jpg"]],
  [3, ["/services/3/1.jpg", "/services/3/2.jpg", "/services/3/3.JPEG"]],
  [4, ["/services/4/1.png", "/services/4/2.png", "/services/4/3.png"]],
  [5, ["/services/5/1.png", "/services/5/2.png", "/services/5/3.png"]],
];

const servicesMosaic: Slot[] = SERVICE_MOSAIC.flatMap(([n, files]) =>
  files.map((file, i) => ({
    key: `services.${n}.mobile.${i + 1}`,
    label: `Услуга ${n} — мозаика для телефона, фото ${i + 1}`,
    group: "Главная / Решения",
    legacy: file,
    shape: { w: 400, h: 400 },
    sizes: "33vw",
    alt: `Service ${n} detail ${i + 1}`,
  }))
);

const solutionsHero: Slot[] = [
  { n: 1, file: "/servicesSliderPhoto/1.jpg" },
  { n: 2, file: "/servicesSliderPhoto/2.JPEG" },
  { n: 3, file: "/servicesSliderPhoto/3.JPEG" },
].map(({ n, file }) => ({
  key: `solutions.hero.${n}`,
  label: `Решения — первый экран, слайд ${n}`,
  group: "Решения",
  legacy: file,
  shape: { w: 1920, h: 1080 },
  mobileShape: { w: 390, h: 620 },
  sizes: "100vw",
  alt: `Services slide ${n}`,
}));

const solutionsCards: Slot[] = [
  [1, "/services/mobile/1.jpg", "Employee kits"],
  [2, "/services/mobile/2.JPG", "Event merch"],
  [3, "/services/mobile/3.jpg", "Client gifts"],
  [4, "/services/mobile/4.jpg", "Custom projects"],
].map(([n, file, alt]) => ({
  key: `solutions.card.${n}`,
  label: `Решения — карточка для телефона ${n}`,
  group: "Решения",
  legacy: file as string,
  shape: { w: 700, h: 900 },
  sizes: "100vw",
  alt: alt as string,
}));

const inspiration: Slot[] = INSPIRATION_TILES.map(([n, cols, rows, alt]) => ({
  key: `inspiration.tile-${String(n).padStart(2, "0")}`,
  label: `Inspiration — плитка ${n} (${cols}×${rows})`,
  group: "Inspiration",
  legacy: `/inspirationPage/${n}.png`,
  shape: tileShape(cols, rows),
  mobileShape: { w: 390, h: 390 },
  sizes: `(max-width: 900px) 100vw, ${cols * 25}vw`,
  alt,
}));

const portfolio: Slot[] = [
  [1, "TrauMerch socks"],
  [2, "TrauMerch sweatshirt"],
  [3, "TrauMerch slides"],
  [4, "TrauMerch bucket hat"],
  [5, "TrauMerch cooler"],
  [6, "TrauMerch hoodie"],
].map(([n, alt]) => ({
  key: `portfolio.${n}`,
  label: `Portfolio — карточка ${n}`,
  group: "Portfolio",
  legacy: `/portfolio/${n}.png`,
  shape: { w: 800, h: 800 },
  sizes: "(max-width: 900px) 100vw, 33vw",
  alt: alt as string,
}));

const productSlider: Slot[] = [1, 2].map((n) => ({
  key: `product.slider.${n}`,
  label: `Страница товара — слайдер, фото ${n}`,
  group: "Товар",
  legacy: `/inspiration/${n}.png`,
  shape: { w: 1376, h: 768 },
  sizes: "(max-width: 900px) 100vw, 50vw",
  alt: `Inspiration ${n}`,
}));

const conf: Slot[] = [
  {
    key: "conf.hero",
    label: "Лендинг /conf — верхнее фото",
    group: "Лендинг /conf",
    legacy: "/inspiration/1.png",
    shape: { w: 1376, h: 768 },
    sizes: "100vw",
    alt: "Conference merch",
  },
  {
    key: "conf.row.1",
    label: "Лендинг /conf — блок 1",
    group: "Лендинг /conf",
    legacy: "/services/1.png",
    shape: { w: 1200, h: 1020 },
    sizes: "(max-width: 900px) 100vw, 50vw",
    alt: "Corporate merch",
  },
  {
    key: "conf.row.2",
    label: "Лендинг /conf — блок 2",
    group: "Лендинг /conf",
    legacy: "/gallery/4.jpg",
    shape: { w: 800, h: 1000 },
    sizes: "(max-width: 900px) 100vw, 50vw",
    alt: "Event merch",
  },
  {
    key: "conf.row.3",
    label: "Лендинг /conf — блок 3",
    group: "Лендинг /conf",
    legacy: "/services/3.png",
    shape: { w: 1200, h: 1500 },
    sizes: "(max-width: 900px) 100vw, 50vw",
    alt: "Private label merch",
  },
];

export const SLOTS: readonly Slot[] = [
  ...preloader,
  ...homeHero,
  ...logos,
  ...homeGallery,
  ...homeGalleryPlaceholder,
  ...promises,
  ...team,
  ...servicesMain,
  ...servicesMosaic,
  ...solutionsHero,
  ...solutionsCards,
  ...inspiration,
  ...portfolio,
  ...productSlider,
  ...conf,
];

const bySlotKey = new Map(SLOTS.map((slot) => [slot.key, slot]));

export const getSlot = (key: string): Slot | undefined => bySlotKey.get(key);

export type SlotKey = string;

if (bySlotKey.size !== SLOTS.length) {
  throw new Error("content/slots.ts: дублирующиеся ключи слотов");
}
