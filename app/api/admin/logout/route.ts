import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "../../../../server/admin/session";

/**
 * Выход из админки.
 *
 * Сессия целиком лежит в подписанной куке, отзывать на сервере нечего —
 * достаточно погасить куку у браузера. Атрибуты повторяют те, с которыми она
 * ставилась: браузер удаляет куку только при совпадении имени, домена и пути.
 */

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
