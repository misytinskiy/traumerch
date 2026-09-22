import { describe, expect, it } from "vitest";

import { contentTypeOf, isMediaPath } from "../app/api/admin/_lib/draftFile";
import { withFocal } from "../app/api/admin/_lib/entry";
import { draftMediaUrl, entrySrcSet, thumbSrc } from "../app/admin/_lib/draftMedia";
import type { MediaEntry } from "../server/media/optimize";

const entry = (): MediaEntry => ({
  src: "/media/team.ihor/c4b3dd33-896.webp",
  w: 896,
  h: 1200,
  variants: [
    { w: 448, src: "/media/team.ihor/c4b3dd33-448.webp" },
    { w: 896, src: "/media/team.ihor/c4b3dd33-896.webp" },
  ],
});

describe("запись слота с точкой кадра", () => {
  it("дописывает focal, когда точка задана", () => {
    expect(withFocal(entry(), { x: 50, y: 100 })).toEqual({
      src: "/media/team.ihor/c4b3dd33-896.webp",
      w: 896,
      h: 1200,
      focal: { x: 50, y: 100 },
      variants: entry().variants,
    });
  });

  it("не пишет focal, когда точки нет", () => {
    // Не мелочь: MediaImage ставит инлайновый object-position только при
    // наличии focal, а иначе кадр остаётся за CSS-классом страницы. Запись
    // «по умолчанию 50/50» молча перебила бы вёрстку карточек команды.
    const result = withFocal(entry(), null);
    expect("focal" in result).toBe(false);
  });

  it("выбрасывает старую точку, если её убрали", () => {
    const withOld: MediaEntry = { ...entry(), focal: { x: 10, y: 10 } };
    expect("focal" in withFocal(withOld, null)).toBe(false);
  });

  it("не тащит в запись посторонних полей", () => {
    const dirty = { ...entry(), lastEditor: "кто-то" } as unknown as MediaEntry;
    expect(Object.keys(withFocal(dirty, null))).toEqual(["src", "w", "h", "variants"]);
  });
});

describe("адреса черновых файлов", () => {
  it("уводит путь из public на защищённый роут", () => {
    expect(draftMediaUrl("/media/team.ihor/c4b3dd33-896.webp")).toBe(
      "/api/admin/draft-media/media/team.ihor/c4b3dd33-896.webp"
    );
  });

  it("опубликованные файлы берутся с CDN как есть", () => {
    expect(thumbSrc(entry(), false)).toBe("/media/team.ihor/c4b3dd33-448.webp");
  });

  it("для миниатюры берётся самый мелкий вариант", () => {
    expect(thumbSrc(entry(), true)).toBe(
      "/api/admin/draft-media/media/team.ihor/c4b3dd33-448.webp"
    );
  });

  it("srcset черновика целиком ведёт на роут, без смеси адресов", () => {
    const srcSet = entrySrcSet(entry(), true) ?? "";
    expect(srcSet.split(", ")).toEqual([
      "/api/admin/draft-media/media/team.ihor/c4b3dd33-448.webp 448w",
      "/api/admin/draft-media/media/team.ihor/c4b3dd33-896.webp 896w",
    ]);
  });
});

describe("проверка пути к файлу черновика", () => {
  it("пропускает нормальный путь варианта", () => {
    expect(isMediaPath("media/home.hero.1/af4b5026-1296.webp")).toBe(true);
  });

  it("не выпускает запрос за пределы media", () => {
    // Путь приходит из адресной строки и уходит в запрос к репозиторию.
    // Без этой проверки админка сама отдала бы посторонний файл.
    expect(isMediaPath("../.env")).toBe(false);
    expect(isMediaPath("media/../../.env")).toBe(false);
    expect(isMediaPath("content/media.json")).toBe(false);
    expect(isMediaPath("media/slot/file.txt")).toBe(false);
    expect(isMediaPath("media/file.webp")).toBe(false);
  });

  it("тип содержимого выводится из расширения", () => {
    expect(contentTypeOf("media/a/b.webp")).toBe("image/webp");
    expect(contentTypeOf("media/a/b.jpg")).toBe("image/jpeg");
    expect(contentTypeOf("media/a/b.unknown")).toBe("application/octet-stream");
  });
});
