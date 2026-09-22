import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionValue,
} from "../../../../server/admin/session";

/**
 * Вход в админку по общему паролю.
 *
 * Роут намеренно на Node, а не на Edge: timingSafeEqual есть только в
 * node:crypto. Проверка выданной куки живёт отдельно (server/admin/session.ts)
 * и считается через Web Crypto, потому что её делает middleware на Edge.
 *
 * Переменные окружения читаются внутри обработчика, а не на уровне модуля:
 * иначе значение запоминалось бы на всю жизнь инстанса, и правку настроек в
 * Vercel нельзя было бы проверить, не дождавшись перезапуска.
 */

export const runtime = "nodejs";

/** Тело здесь — один пароль. Всё, что больше, разбирать незачем. */
const MAX_BODY_BYTES = 1024;

/**
 * Ограничение перебора: 10 попыток в минуту на инстанс.
 *
 * Счётчик в памяти процесса, то есть при нескольких инстансах предел общий
 * выше. Это осознанное упрощение: цель — не пустить перебор пароля с одной
 * машины, а не построить точный лимитер. Для точного нужен общий счётчик во
 * внешнем хранилище, которого в проекте нет.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
let windowStartedAt = 0;
let windowCount = 0;

const withinRateLimit = (): boolean => {
  const now = Date.now();
  if (now - windowStartedAt > RATE_WINDOW_MS) {
    windowStartedAt = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount <= RATE_LIMIT;
};

/**
 * Пароли сравниваются по хешам, а не напрямую: timingSafeEqual бросает
 * исключение на буферах разной длины, а длина введённого пароля — как раз то,
 * что подбирающий знает и так. Хеш даёт обеим сторонам одинаковые 32 байта.
 */
const samePassword = (given: string, expected: string): boolean =>
  timingSafeEqual(
    createHash("sha256").update(given, "utf8").digest(),
    createHash("sha256").update(expected, "utf8").digest()
  );

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!password || !secret) {
    // Молча пускать при незаданных переменных нельзя, молча не пускать —
    // тоже: тогда настройку ищут в коде вместо переменных окружения.
    console.error("[admin-login] не заданы переменные окружения", {
      hasPassword: Boolean(password),
      hasSecret: Boolean(secret),
    });
    return NextResponse.json(
      {
        error:
          "Вход не настроен: на сервере нет ADMIN_PASSWORD или ADMIN_SESSION_SECRET.",
      },
      { status: 503 }
    );
  }

  if (!withinRateLimit()) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите минуту." },
      { status: 429 }
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать запрос." }, { status: 400 });
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Слишком длинный запрос." }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Ожидался JSON." }, { status: 400 });
  }

  const given =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).password
      : undefined;

  if (typeof given !== "string" || !given) {
    return NextResponse.json({ error: "Введите пароль." }, { status: 400 });
  }

  if (!samePassword(given, password)) {
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: await createSessionValue(secret),
    httpOnly: true,
    // Браузеры считают http://localhost защищённым контекстом, поэтому Secure
    // не мешает и локальной разработке.
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
