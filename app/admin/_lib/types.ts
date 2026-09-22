/**
 * Формат обмена между админкой и её роутами.
 *
 * Типы лежат отдельно от обеих сторон, потому что иначе клиентский компонент
 * потянул бы за собой серверный модуль (а вместе с ним sharp и токен) ради
 * одного описания ответа.
 */

/** Запись слота — то же, что лежит в content/media.json. */
export type SlotEntry = {
  src: string;
  w: number;
  h: number;
  focal?: { x: number; y: number };
  variants: { w: number; src: string }[];
};

export type DraftInfo = {
  /** false — ветки черновика нет, всё опубликовано. */
  exists: boolean;
  branch: string;
  baseBranch: string;
  /** Ключи слотов, отличающихся от боевой ветки. */
  changedSlots: string[];
};

export type AdminState = {
  draft: DraftInfo;
  /** Что показывать в админке: черновик поверх опубликованного. */
  entries: Record<string, SlotEntry>;
};

export type SaveSlotResult = {
  entry: SlotEntry;
  /** Размеры исходника после поворота по EXIF — для отчёта клиенту. */
  source: { width: number; height: number; bytes: number };
  /** Сколько вариантов записано и сколько старых удалено. */
  files: number;
  removed: number;
};

export type PublishResult = {
  /** false — публиковать было нечего, и сообщать об успехе нельзя. */
  published: boolean;
  slots: string[];
  /** false — коммит прошёл, но ветку черновика удалить не удалось. */
  draftReset: boolean;
};

/** Отпечаток content/media.json того деплоя, который сейчас отвечает. */
export type LiveMedia = { fingerprint: string };

/** Ошибка от роута админки. Текст всегда пригоден для показа клиенту. */
export type ApiFailure = { ok: false; error: string };
