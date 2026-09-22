import { readMediaFile } from "../../_lib/draftFile";
import { fail, failure, settingsProblem } from "../../_lib/respond";

/**
 * Раздача черновых фотографий.
 *
 * Файлы черновика лежат в ветке репозитория, а не в public — по обычному
 * адресу /media/... их нет, там опубликованная версия. Без этого роута превью
 * изменённого слота показывало бы битую картинку, а превью настоящей страницы
 * не работало бы вовсе.
 *
 * Роут закрыт middleware вместе со всем /api/admin: наружу неопубликованные
 * фотографии не уходят.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  const { path } = await params;
  const joined = (path ?? []).join("/");

  try {
    const file = await readMediaFile(joined);
    if (!file) {
      return fail("Такой фотографии в черновике нет.", 404);
    }

    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.body.length),
        // Имя файла содержит хеш содержимого, то есть по одному адресу всегда
        // лежит одно и то же. Кешировать можно смело, и это заметно: превью
        // настоящей страницы иначе тянуло бы каждый вариант через GitHub
        // заново при каждом переключении десктоп/телефон.
        // private — чтобы черновик не осел в общем кеше CDN.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return failure(`чтение файла черновика ${joined}`, error);
  }
}
