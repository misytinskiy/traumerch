import { publishDraft } from "../../../../server/github/repo";
import { fail, failure, ok, settingsProblem } from "../_lib/respond";

/**
 * Публикация: всё накопленное одним коммитом в боевую ветку.
 *
 * Отдельный случай — публиковать нечего. Ответить «готово» на пустой черновик
 * нельзя: клиент будет ждать обновления сайта, которого не произойдёт, и
 * решит, что кнопка сломана. Поэтому published: false уезжает наружу явно.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Сборка дерева со ста слотами — это десятки запросов к GitHub подряд. */
export const maxDuration = 60;

export async function POST() {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  try {
    const result = await publishDraft();
    return ok({
      published: result.commitSha !== null,
      slots: result.slots,
      draftReset: result.draftReset,
    });
  } catch (error) {
    return failure("публикация черновика", error);
  }
}
