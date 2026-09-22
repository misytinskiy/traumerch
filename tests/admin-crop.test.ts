import { describe, expect, it } from "vitest";

import { SLOTS } from "../content/slots";
import { neededWidth } from "../app/admin/_lib/neededWidth.server";
import {
  CENTER,
  focalFromPoint,
  objectPosition,
  parseFocal,
  sameFocal,
} from "../app/admin/_lib/focal";
import { checkResolution } from "../app/admin/_lib/resolution";
import { MAX_WIDTH, targetWidths } from "../server/media/optimize";

/**
 * Кадрировка и предупреждение о мелком фото.
 *
 * Обе вещи тихие: ошибка в пересчёте точки кадра не падает, а сдвигает лицо на
 * опубликованной фотографии; расхождение в «нужной ширине» не падает тем
 * более — просто клиенту говорят неправду о его файле.
 */

describe("точка кадра", () => {
  it("переводит клик в проценты от рамки", () => {
    expect(focalFromPoint({ width: 400, height: 200 }, { x: 100, y: 150 })).toEqual({
      x: 25,
      y: 75,
    });
  });

  it("клик в угол даёт край, а не выход за границы", () => {
    expect(focalFromPoint({ width: 400, height: 200 }, { x: 0, y: 0 })).toEqual({
      x: 0,
      y: 0,
    });
    expect(focalFromPoint({ width: 400, height: 200 }, { x: 400, y: 200 })).toEqual({
      x: 100,
      y: 100,
    });
  });

  it("промах мимо рамки прижимается к краю", () => {
    expect(focalFromPoint({ width: 400, height: 200 }, { x: -30, y: 900 })).toEqual({
      x: 0,
      y: 100,
    });
  });

  it("округляет до десятых, чтобы не тащить хвосты в media.json", () => {
    expect(focalFromPoint({ width: 3, height: 3 }, { x: 1, y: 2 })).toEqual({
      x: 33.3,
      y: 66.7,
    });
  });

  it("на нулевой рамке отдаёт центр, а не NaN", () => {
    expect(focalFromPoint({ width: 0, height: 0 }, { x: 5, y: 5 })).toEqual(CENTER);
  });

  it("собирает значение для object-position", () => {
    expect(objectPosition({ x: 20, y: 80 })).toBe("20% 80%");
  });

  it("без точки кадра object-position — центр", () => {
    expect(objectPosition(undefined)).toBe("50% 50%");
  });

  it("сравнивает отсутствующую точку с центром как одно и то же", () => {
    expect(sameFocal(undefined, CENTER)).toBe(true);
    expect(sameFocal({ x: 50, y: 60 }, CENTER)).toBe(false);
  });
});

describe("разбор точки кадра из запроса", () => {
  it("читает объект и строку", () => {
    expect(parseFocal({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
    expect(parseFocal('{"x":10,"y":20}')).toEqual({ x: 10, y: 20 });
  });

  it("отсутствие точки — это null, а не центр", () => {
    // Разница принципиальная: null означает «не писать focal в media.json»,
    // и тогда object-position остаётся за CSS-классом страницы.
    expect(parseFocal(undefined)).toBeNull();
    expect(parseFocal("")).toBeNull();
    expect(parseFocal(null)).toBeNull();
  });

  it("мусор не превращается в NaN внутри вёрстки", () => {
    expect(parseFocal({ x: "10", y: 20 })).toBeNull();
    expect(parseFocal({ x: Number.NaN, y: 0 })).toBeNull();
    expect(parseFocal("не json")).toBeNull();
    expect(parseFocal([1, 2])).toBeNull();
  });

  it("выходящие за пределы значения прижимаются к краю", () => {
    expect(parseFocal({ x: -40, y: 180 })).toEqual({ x: 0, y: 100 });
  });
});

describe("предупреждение о мелком фото", () => {
  it("молчит, когда разрешения хватает", () => {
    expect(checkResolution(2400, 2400).warning).toBeNull();
    expect(checkResolution(2400, 3000).warning).toBeNull();
  });

  it("называет обе цифры, чтобы было понятно, насколько мелко", () => {
    const { warning } = checkResolution(2400, 800);
    expect(warning).toContain("2400");
    expect(warning).toContain("800");
  });

  it("не запрещает публикацию — только предупреждает", () => {
    // Решение владельца: предупреждать, но разрешать. Если однажды текст
    // станет запретом, это должно быть осознанным изменением, а не опечаткой.
    expect(checkResolution(2400, 800).warning).toContain("Опубликовать можно");
  });
});

describe("нужная ширина слота", () => {
  it("совпадает с тем, что конвейер реально нарежет", () => {
    for (const slot of SLOTS) {
      const widths = targetWidths(slot, MAX_WIDTH);
      const expected = widths.length ? widths[widths.length - 1] : 0;
      expect(neededWidth(slot), slot.key).toBe(expected);
    }
  });

  it("у каждого слота осмысленная, не нулевая потребность", () => {
    for (const slot of SLOTS) {
      expect(neededWidth(slot), slot.key).toBeGreaterThan(0);
      expect(neededWidth(slot), slot.key).toBeLessThanOrEqual(MAX_WIDTH);
    }
  });

  it("учитывает мобильные пропорции, а не только десктопные", () => {
    // У части слотов мобильное место требует больше пикселей: телефоны почти
    // поголовно 3x. Если считать только по десктопу, такие фотографии уедут
    // на сайт заведомо мыльными.
    const wide = { shape: { w: 400, h: 300 }, mobileShape: { w: 390, h: 600 } };
    expect(neededWidth(wide)).toBe(1170);
    expect(neededWidth({ shape: { w: 400, h: 300 } })).toBe(800);
  });
});
