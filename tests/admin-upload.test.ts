import { describe, expect, it } from "vitest";

import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_EDGE,
  fitLongestSide,
  needsReencode,
} from "../app/admin/_lib/upload";

/**
 * Уменьшение файла в браузере.
 *
 * Проверяется чистая математика, а не canvas: сам холст в node не поднять, да
 * и ломается здесь не он. Ломается расчёт — и последствия видны не сразу:
 * фотография уедет на сервер в полтора раза шире нужного (и упрётся в лимит
 * платформы) либо, наоборот, окажется растянутой из мелкого исходника.
 */

describe("fitLongestSide", () => {
  it("вписывает длинную сторону в предел, сохраняя пропорции", () => {
    expect(fitLongestSide({ width: 4032, height: 3024 }, 2560)).toEqual({
      width: 2560,
      height: 1920,
    });
  });

  it("считает длинной сторону по вертикали у портретного кадра", () => {
    expect(fitLongestSide({ width: 3024, height: 4032 }, 2560)).toEqual({
      width: 1920,
      height: 2560,
    });
  });

  it("не увеличивает то, что и так меньше предела", () => {
    expect(fitLongestSide({ width: 800, height: 600 }, 2560)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("не отдаёт нулевую сторону на очень вытянутой картинке", () => {
    const result = fitLongestSide({ width: 5000, height: 3 }, 2560);
    expect(result.width).toBe(2560);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it("переживает нулевой размер, не деля на ноль", () => {
    expect(fitLongestSide({ width: 0, height: 0 }, 2560)).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe("needsReencode", () => {
  it("не трогает файл, который влезает и по весу, и по ширине", () => {
    expect(needsReencode({ width: 1600, height: 1200 }, 900_000)).toBe(false);
  });

  it("пересобирает слишком широкий снимок даже при малом весе", () => {
    expect(needsReencode({ width: 6000, height: 4000 }, 500_000)).toBe(true);
  });

  it("пересобирает тяжёлый файл, даже если размеры в порядке", () => {
    expect(needsReencode({ width: 1200, height: 900 }, 9_000_000)).toBe(true);
  });

  it("предел веса ниже ограничения платформы на тело запроса", () => {
    // 4.5 МБ — то, что рубит Vercel. Свой предел обязан быть меньше, иначе
    // клиент получает не ошибку, а оборванное соединение.
    expect(MAX_UPLOAD_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });

  it("предел ширины совпадает с потолком конвейера", async () => {
    const { MAX_WIDTH } = await import("../server/media/optimize");
    // Уменьшать сильнее, чем конвейер потом использует, значит терять
    // пиксели впустую; слабее — впустую гонять их по сети.
    expect(MAX_UPLOAD_EDGE).toBe(MAX_WIDTH);
  });
});
