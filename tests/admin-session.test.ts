import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionValue,
  verifySessionValue,
} from "../server/admin/session";

/**
 * Проверяется единственное, ради чего эта кука существует: что ею нельзя
 * воспользоваться, не зная секрета. Все четыре способа обойти проверку —
 * подделать подпись, продлить срок, подписать своим секретом, подсунуть
 * мусор — разбираются по отдельности, потому что каждый из них закрывается
 * своей строкой кода и любую из них легко потерять при правке.
 */

const SECRET = "секрет-для-тестов-0123456789";

describe("сессионная кука админки", () => {
  it("пропускает только что выданную куку", async () => {
    const value = await createSessionValue(SECRET);

    expect(await verifySessionValue(value, SECRET)).toBe(true);
  });

  it("отвергает подделанную подпись", async () => {
    const value = await createSessionValue(SECRET);
    const [expiresAt, signature] = value.split(".");

    // Меняем один символ подписи — этого достаточно.
    const forgedChar = signature[0] === "a" ? "b" : "a";
    const forged = `${expiresAt}.${forgedChar}${signature.slice(1)}`;

    expect(forged).not.toBe(value);
    expect(await verifySessionValue(forged, SECRET)).toBe(false);
  });

  it("отвергает попытку продлить срок, не трогая подпись", async () => {
    const value = await createSessionValue(SECRET);
    const [expiresAt, signature] = value.split(".");
    const extended = `${Number(expiresAt) + 365 * 24 * 3600 * 1000}.${signature}`;

    expect(await verifySessionValue(extended, SECRET)).toBe(false);
  });

  it("отвергает просроченную куку", async () => {
    const now = Date.now();
    const value = await createSessionValue(SECRET, { now, ttlSeconds: 60 });

    expect(await verifySessionValue(value, SECRET, { now: now + 59_000 })).toBe(
      true
    );
    expect(await verifySessionValue(value, SECRET, { now: now + 61_000 })).toBe(
      false
    );
  });

  it("отвергает куку, подписанную чужим секретом", async () => {
    const value = await createSessionValue("чужой-секрет");

    expect(await verifySessionValue(value, SECRET)).toBe(false);
  });

  it("отвергает мусор и пустой секрет", async () => {
    const value = await createSessionValue(SECRET);

    expect(await verifySessionValue("", SECRET)).toBe(false);
    expect(await verifySessionValue(undefined, SECRET)).toBe(false);
    expect(await verifySessionValue("без-точки", SECRET)).toBe(false);
    expect(await verifySessionValue(".подпись", SECRET)).toBe(false);
    expect(await verifySessionValue("не-число.подпись", SECRET)).toBe(false);
    // Незаданная переменная окружения не должна открывать вход всем подряд.
    expect(await verifySessionValue(value, "")).toBe(false);
    expect(await verifySessionValue(value, undefined)).toBe(false);
  });

  it("выдаёт срок на неделю вперёд", async () => {
    const now = Date.now();
    const value = await createSessionValue(SECRET, { now });

    expect(Number(value.split(".")[0])).toBe(now + SESSION_TTL_SECONDS * 1000);
  });
});

const ORIGINAL_ENV = process.env;

const PASSWORD = "правильный-пароль";

const post = async (body: unknown) => {
  const { POST } = await import("../app/api/admin/login/route");
  const request = new Request("http://localhost/api/admin/login", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return POST(request);
};

describe("api/admin/login", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      ADMIN_PASSWORD: PASSWORD,
      ADMIN_SESSION_SECRET: SECRET,
    };
    // Счётчик попыток живёт в модуле, поэтому каждому тесту нужен свой модуль.
    vi.resetModules();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("на верный пароль выдаёт рабочую куку", async () => {
    const response = await post({ password: PASSWORD });

    expect(response.status).toBe(200);

    const cookie = response.cookies.get(ADMIN_SESSION_COOKIE);
    expect(cookie).toBeTruthy();
    expect(await verifySessionValue(cookie?.value, SECRET)).toBe(true);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.secure).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.path).toBe("/");
  });

  it("на неверный пароль куку не выдаёт", async () => {
    const response = await post({ password: "подбор" });

    expect(response.status).toBe(401);
    expect(response.cookies.get(ADMIN_SESSION_COOKIE)).toBeUndefined();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("на пустое и не строковое значение отвечает 400", async () => {
    expect((await post({ password: "" })).status).toBe(400);
    expect((await post({ password: 123 })).status).toBe(400);
    expect((await post("не json")).status).toBe(400);
  });

  it("упирается в 429 после десяти попыток за минуту", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await post({ password: `подбор-${attempt}` });
      expect(response.status).toBe(401);
    }

    // Одиннадцатая не проходит даже с верным паролем — иначе предел обходился
    // бы тем, что перебор идёт до первого совпадения.
    const blocked = await post({ password: PASSWORD });
    expect(blocked.status).toBe(429);
    expect(blocked.cookies.get(ADMIN_SESSION_COOKIE)).toBeUndefined();
  });

  it("отпускает после окончания минутного окна", async () => {
    vi.useFakeTimers();
    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await post({ password: "подбор" });
      }
      expect((await post({ password: PASSWORD })).status).toBe(429);

      vi.advanceTimersByTime(61_000);

      expect((await post({ password: PASSWORD })).status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it("без переменных окружения отвечает 503 и объясняет причину", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    vi.resetModules();

    const response = await post({ password: PASSWORD });

    expect(response.status).toBe(503);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toContain("ADMIN_PASSWORD");
    expect(payload.error).toContain("ADMIN_SESSION_SECRET");
    expect(response.cookies.get(ADMIN_SESSION_COOKIE)).toBeUndefined();
    expect(error).toHaveBeenCalled();
  });

  it("не пускает, когда задан только один из двух секретов", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect((await post({ password: PASSWORD })).status).toBe(503);
  });
});

describe("api/admin/logout", () => {
  it("гасит куку", async () => {
    const { POST } = await import("../app/api/admin/logout/route");
    const response = await POST();

    expect(response.status).toBe(200);
    const cookie = response.cookies.get(ADMIN_SESSION_COOKIE);
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
    expect(cookie?.path).toBe("/");
  });
});
