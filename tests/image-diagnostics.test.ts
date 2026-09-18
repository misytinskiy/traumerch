import { afterEach, describe, expect, it, vi } from "vitest";

import { describeError, hostOf, redact } from "../server/diagnostics/redact";
import { buildRetrySrcSet, buildRetryUrl } from "../shared/imageRetry";
import { parseProductPhotoUrl } from "../shared/productPhoto";

const ORIGIN = "https://traumerch.example";

/**
 * Диагностика заводится, чтобы найти причину битых картинок. Две вещи в ней
 * могут навредить сильнее, чем помочь: утечка подписанных ссылок и токенов в
 * логи и подделка строк лога через открытый наружу эндпоинт. Проверяется в
 * первую очередь это, а уже потом полезное поведение.
 */

describe("redact", () => {
  it("вырезает подписанную ссылку Airtable целиком", () => {
    const message =
      "fetch failed for https://v5.airtableusercontent.com/v3/u/41/abc?sig=SECRET&exp=123";

    const result = redact(message);

    expect(result).not.toContain("airtableusercontent");
    expect(result).not.toContain("SECRET");
    expect(result).toContain("<url>");
  });

  it("вырезает токены Airtable и заголовок авторизации", () => {
    expect(redact("token patAbc123456789.def")).not.toContain("patAbc123456789");
    expect(redact("Authorization: Bearer patXyz0123456789")).not.toContain(
      "patXyz0123456789"
    );
    expect(redact("keyABCDEFGHIJKLMN failed")).not.toContain("keyABCDEFGHIJKLMN");
  });

  it("схлопывает переводы строк, чтобы в лог нельзя было дописать свою строку", () => {
    const forged = 'real\n{"tag":"photo","outcome":"ok","status":200}';

    const result = redact(forged);

    expect(result).not.toContain("\n");
    expect(result).not.toContain("\r");
  });

  it("обрезает слишком длинное значение", () => {
    expect(redact("a".repeat(500)).length).toBeLessThanOrEqual(301);
  });

  it("оставляет от адреса только хост", () => {
    expect(hostOf("https://v5.airtableusercontent.com/v3/u/41/x?sig=SECRET")).toBe(
      "v5.airtableusercontent.com"
    );
    expect(hostOf("не адрес")).toBe("invalid-url");
  });

  it("разворачивает причину ошибки, не вынося наружу адрес", () => {
    const cause = Object.assign(
      new Error("connect ETIMEDOUT https://v5.airtableusercontent.com/x?sig=S"),
      { code: "ETIMEDOUT" }
    );
    const error = new Error("Не удалось загрузить источник", { cause });

    const result = describeError(error);

    expect(result).toContain("ETIMEDOUT");
    expect(result).not.toContain("airtableusercontent");
    expect(result).not.toContain("sig=S");
  });
});

describe("buildRetryUrl", () => {
  it("дописывает параметр во внутренний адрес next/image, а не поверх него", () => {
    const src =
      "/_next/image?url=%2Fapi%2Fproduct-photo%2FrecA1%2FattB2%2Fmaster&w=1920&q=90";

    const result = buildRetryUrl(src, 1, ORIGIN);

    expect(result).toBeTruthy();
    const url = new URL(result as string, ORIGIN);
    expect(url.pathname).toBe("/_next/image");
    // Ширина и качество не потерялись.
    expect(url.searchParams.get("w")).toBe("1920");
    expect(url.searchParams.get("q")).toBe("90");
    // Параметр ушёл внутрь: иначе оптимизатор пересобрал бы ключ у себя, а
    // наш роут отдал бы из кеша тот же самый сломанный ответ.
    expect(url.searchParams.get("r")).toBeNull();
    const inner = url.searchParams.get("url") as string;
    expect(inner).toContain("/api/product-photo/recA1/attB2/master");
    expect(new URL(inner, ORIGIN).searchParams.get("r")).toBe("1");
  });

  it("дописывает параметр к обычному адресу", () => {
    const result = buildRetryUrl("/media/hero-a1b2c3.webp", 1, ORIGIN);

    expect(new URL(result as string, ORIGIN).searchParams.get("r")).toBe("1");
  });

  it("не трогает чужой origin", () => {
    expect(buildRetryUrl("https://example.com/a.png", 1, ORIGIN)).toBeNull();
  });

  it("не трогает внешний источник внутри оптимизатора", () => {
    const src = "/_next/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=640&q=75";

    expect(buildRetryUrl(src, 1, ORIGIN)).toBeNull();
  });

  it("не пытается повторять data: и пустой адрес", () => {
    expect(buildRetryUrl("data:image/gif;base64,R0lGOD", 1, ORIGIN)).toBeNull();
    expect(buildRetryUrl("", 1, ORIGIN)).toBeNull();
  });
});

describe("buildRetrySrcSet", () => {
  it("переписывает каждый вариант и сохраняет дескрипторы", () => {
    const srcSet = [
      "/_next/image?url=%2Fapi%2Fproduct-photo%2FrecA%2FattB%2Fmaster&w=640&q=90 640w",
      "/_next/image?url=%2Fapi%2Fproduct-photo%2FrecA%2FattB%2Fmaster&w=1920&q=90 1920w",
    ].join(", ");

    const result = buildRetrySrcSet(srcSet, 1, ORIGIN) as string;

    const entries = result.split(", ");
    expect(entries).toHaveLength(2);
    expect(entries[0].endsWith(" 640w")).toBe(true);
    expect(entries[1].endsWith(" 1920w")).toBe(true);
    for (const entry of entries) {
      const inner = new URL(entry.split(" ")[0], ORIGIN).searchParams.get(
        "url"
      ) as string;
      expect(new URL(inner, ORIGIN).searchParams.get("r")).toBe("1");
    }
  });

  it("возвращает null, если хоть один вариант переписать нельзя", () => {
    const srcSet = "/media/a.webp 640w, https://example.com/b.webp 1280w";

    expect(buildRetrySrcSet(srcSet, 1, ORIGIN)).toBeNull();
  });
});

describe("parseProductPhotoUrl", () => {
  it("достаёт идентификаторы из прямого адреса", () => {
    expect(
      parseProductPhotoUrl("/api/product-photo/recAbc123/attXyz789/master")
    ).toEqual({ recordId: "recAbc123", attachmentId: "attXyz789" });
  });

  it("достаёт идентификаторы из обёртки next/image", () => {
    expect(
      parseProductPhotoUrl(
        "/_next/image?url=%2Fapi%2Fproduct-photo%2FrecAbc123%2FattXyz789%2Fmaster&w=640&q=90"
      )
    ).toEqual({ recordId: "recAbc123", attachmentId: "attXyz789" });
  });

  it("возвращает null на посторонних адресах", () => {
    expect(parseProductPhotoUrl("/media/hero-a1b2.webp")).toBeNull();
    expect(parseProductPhotoUrl("")).toBeNull();
  });
});

describe("api/image-diagnostics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const post = async (body: string, headers?: Record<string, string>) => {
    const { POST } = await import("../app/api/image-diagnostics/route");
    const request = new Request("http://localhost/api/image-diagnostics", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json", ...headers },
    });
    return POST(request as never);
  };

  it("принимает отчёт и пишет в лог идентификаторы из адреса", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await post(
      JSON.stringify({
        outcome: "failed",
        src: "/_next/image?url=%2Fapi%2Fproduct-photo%2FrecAbc123%2FattXyz789%2Fmaster&w=640&q=90",
        currentSrc: "",
        page: "/catalog",
        attempts: 1,
      })
    );

    expect(response.status).toBe(204);
    expect(error).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(error.mock.calls[0][0] as string);
    expect(logged.tag).toBe("photo-client");
    expect(logged.recordId).toBe("recAbc123");
    expect(logged.attachmentId).toBe("attXyz789");
    expect(logged.outcome).toBe("failed");
  });

  it("пишет догрузившуюся со второй попытки картинку отдельно от отказа", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await post(
      JSON.stringify({
        outcome: "recovered",
        src: "/api/product-photo/recAbc123/attXyz789/master?r=1",
        page: "/catalog",
        attempts: 1,
      })
    );

    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(warn.mock.calls[0][0] as string).outcome).toBe("recovered");
  });

  it("не даёт дописать в лог поддельную строку", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await post(
      JSON.stringify({
        outcome: "failed",
        src: "/api/product-photo/recAbc123/attXyz789/master",
        page: '/catalog\n{"tag":"photo","outcome":"ok"}',
        attempts: 1,
      })
    );

    const logged = JSON.parse(error.mock.calls[0][0] as string);
    expect(logged.page).not.toContain("\n");
  });

  it("отклоняет слишком большое тело", async () => {
    const response = await post(
      JSON.stringify({ outcome: "failed", src: "x".repeat(4000) })
    );

    expect(response.status).toBe(413);
  });

  it("отклоняет мусор вместо JSON и отчёт без адреса", async () => {
    expect((await post("не json")).status).toBe(400);
    expect((await post(JSON.stringify({ outcome: "failed" }))).status).toBe(400);
    expect((await post(JSON.stringify(["массив"]))).status).toBe(400);
  });
});
