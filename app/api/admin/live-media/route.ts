import { createHash } from "node:crypto";

import media from "../../../../content/media.json";

/**
 * Отпечаток реестра фотографий В ЭТОЙ СБОРКЕ.
 *
 * Нужен, чтобы после публикации честно сказать «готово», а не показать
 * бодрую надпись и оставить клиента гадать. Между коммитом и обновлением
 * сайта проходит минута-две пересборки, и всё это время сайт отдаёт старое.
 *
 * Хитрость в том, что media.json попадает в бандл на сборке. Значит, ответ
 * этого роута меняется ровно тогда, когда новая сборка начала обслуживать
 * запросы, — не раньше и не позже. Опрашивать коммит в GitHub бесполезно: он
 * появляется мгновенно и про состояние сайта не говорит ничего.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fingerprint = createHash("sha1")
  .update(JSON.stringify(media))
  .digest("hex")
  .slice(0, 12);

export async function GET() {
  return Response.json(
    { ok: true, fingerprint },
    // Ответ обязан быть свежим: закешированный где-то по дороге отпечаток
    // означает бесконечное ожидание «сайт обновляется».
    { headers: { "Cache-Control": "no-store" } }
  );
}
