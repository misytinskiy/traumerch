import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { fetchAirtable } from "../server/airtable/airtable";

/**
 * fetchAirtable отдаёт наружу Response, который вызывающий код читает через
 * .json() или .text(). Раньше это происходило уже после снятия таймаута, то
 * есть чтение тела ничем не ограничивалось. Сейчас тело вычитывается внутри,
 * и эти проверки следят, чтобы контракт при этом не поехал.
 */

let server: http.Server;
let base: string;
let attemptsByPath: Record<string, number>;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const path = req.url ?? "";
    attemptsByPath[path] = (attemptsByPath[path] ?? 0) + 1;

    if (path.startsWith("/json")) {
      res.writeHead(200, { "Content-Type": "application/json", "X-Marker": "kept" });
      res.end(JSON.stringify({ records: [{ id: "rec1" }] }));
      return;
    }

    // Первый заход отвечает 429, второй — успехом.
    if (path.startsWith("/retry-once")) {
      if (attemptsByPath[path] === 1) {
        res.writeHead(429, { "Content-Type": "text/plain" });
        res.end("rate limited");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ records: [] }));
      return;
    }

    if (path.startsWith("/always-429")) {
      res.writeHead(429, { "Content-Type": "text/plain" });
      res.end("rate limited");
      return;
    }

    if (path.startsWith("/not-found")) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("nope");
      return;
    }

    if (path.startsWith("/no-content")) {
      res.writeHead(204);
      res.end();
      return;
    }

    if (path.startsWith("/stall")) {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": "999999",
      });
      res.write("{");
      return; // тело не дойдёт
    }

    res.writeHead(500);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeAll(() => {
  attemptsByPath = {};
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("fetchAirtable", () => {
  it("отдаёт читаемый JSON и сохраняет статус с заголовками", async () => {
    const response = await fetchAirtable(`${base}/json`, "token");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-marker")).toBe("kept");
    await expect(response.json()).resolves.toEqual({ records: [{ id: "rec1" }] });
  });

  it("повторяет запрос после 429 и возвращает успешный ответ", async () => {
    const response = await fetchAirtable(`${base}/retry-once`, "token");

    expect(response.status).toBe(200);
    expect(attemptsByPath["/retry-once"]).toBe(2);
  });

  it("перестаёт повторять, когда попытки закончились", async () => {
    const response = await fetchAirtable(`${base}/always-429`, "token", {
      retries: 1,
    });

    expect(response.status).toBe(429);
    expect(attemptsByPath["/always-429"]).toBe(2);
  });

  it("не повторяет запрос на клиентской ошибке", async () => {
    const response = await fetchAirtable(`${base}/not-found`, "token");

    expect(response.status).toBe(404);
    expect(attemptsByPath["/not-found"]).toBe(1);
    await expect(response.text()).resolves.toBe("nope");
  });

  it("не падает на ответе без тела", async () => {
    const response = await fetchAirtable(`${base}/no-content`, "token");

    expect(response.status).toBe(204);
  });

  it("прерывается, когда тело ответа зависло", async () => {
    const started = Date.now();

    await expect(
      fetchAirtable(`${base}/stall`, "token", { timeoutMs: 150, retries: 0 })
    ).rejects.toMatchObject({ timedOut: true });

    expect(Date.now() - started).toBeLessThan(3000);
  });
});
