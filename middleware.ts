import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifySessionValue,
} from "./server/admin/session";

/**
 * Охрана админки.
 *
 * ГЛАВНОЕ ПРО matcher. Сайт отдаётся готовым HTML с CDN — динамической
 * осталась только /design. Middleware выполняется на каждом запросе, который
 * под matcher попал, поэтому расширение matcher'а за пределы админки вернёт
 * весь сайт в serverless и убьёт ту скорость, ради которой рендеринг
 * переделывали. Здесь ровно два пути и ни одного «на всякий случай».
 *
 * Страницы входа исключаются в самом обработчике, а не в matcher: выражения в
 * matcher компилируются на сборке, ошибиться в отрицании там легко и цена
 * ошибки — либо дыра, либо невозможность войти. Проверка по точному пути
 * читается однозначно.
 */

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

/** Пути, которым кука не нужна: без них её негде было бы получить. */
const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isValid = await verifySessionValue(
    session,
    process.env.ADMIN_SESSION_SECRET
  );

  if (isValid) {
    return NextResponse.next();
  }

  // Браузеру нужна форма входа, а fetch из админки — разбираемый ответ.
  // Редирект на HTML в ответ на запрос за JSON обернулся бы невнятной
  // ошибкой разбора вместо честного «сессия кончилась».
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Требуется вход в админку." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}
