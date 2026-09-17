import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  FetchDeadlineError,
  fetchWithDeadline,
} from "../server/http/fetchWithDeadline";

/**
 * Эти проверки защищают конкретную ошибку, которая уже была допущена дважды:
 * таймаут снимался после получения заголовков, и тело читалось без всякого
 * ограничения по времени. Зависшее соединение висело до тех пор, пока процесс
 * не убьют снаружи.
 *
 * Отдельно проверяется, что обрыв соединения не выдаётся за таймаут: от этого
 * зависит, какой статус увидит вызывающий код (502 против 504) и где будут
 * искать причину по логам.
 */

let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    switch (req.url) {
      case "/ok":
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(Buffer.alloc(64, 7));
        return;

      case "/stall-body":
        // Заголовки ушли, тело обещано, но не придёт никогда.
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": "999999",
        });
        res.write(Buffer.alloc(16));
        return;

      case "/drop-body":
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": "999999",
        });
        res.write(Buffer.alloc(16));
        setTimeout(() => req.socket.destroy(), 20);
        return;

      case "/no-content":
        res.writeHead(204);
        res.end();
        return;

      case "/server-error":
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("boom");
        return;

      default:
        res.writeHead(404);
        res.end();
    }
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("fetchWithDeadline", () => {
  it("читает тело целиком при нормальном ответе", async () => {
    const result = await fetchWithDeadline(`${base}/ok`, { timeoutMs: 2000 });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.body.byteLength).toBe(64);
    expect(result.headers.get("content-type")).toBe("image/png");
  });

  it("прерывается, когда тело зависло после заголовков", async () => {
    const started = Date.now();

    await expect(
      fetchWithDeadline(`${base}/stall-body`, { timeoutMs: 150 })
    ).rejects.toMatchObject({ timedOut: true });

    // Главное: управление вернулось примерно за отведённое время, а не
    // зависло до внешнего убийства процесса.
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it("отличает обрыв соединения от таймаута", async () => {
    try {
      await fetchWithDeadline(`${base}/drop-body`, { timeoutMs: 5000 });
      throw new Error("ожидали ошибку, но загрузка завершилась успешно");
    } catch (error) {
      expect(error).toBeInstanceOf(FetchDeadlineError);
      expect((error as FetchDeadlineError).timedOut).toBe(false);
    }
  });

  it("не пытается читать тело у 204", async () => {
    const result = await fetchWithDeadline(`${base}/no-content`, {
      timeoutMs: 2000,
    });

    expect(result.status).toBe(204);
    expect(result.body.byteLength).toBe(0);
  });

  it("возвращает неуспешный ответ вызывающему коду, а не бросает", async () => {
    const result = await fetchWithDeadline(`${base}/server-error`, {
      timeoutMs: 2000,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.body.toString()).toBe("boom");
  });
});
