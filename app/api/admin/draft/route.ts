import { discardDraft } from "../../../../server/github/repo";
import { fail, failure, ok, settingsProblem } from "../_lib/respond";

/**
 * Сброс черновика целиком.
 *
 * Действие необратимое — ветка просто исчезает, вернуть её из админки нечем.
 * Подтверждение спрашивает интерфейс, здесь только выполнение: держать
 * «вы уверены?» на сервере бессмысленно, а дублировать вопрос — раздражающе.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  try {
    const result = await discardDraft();
    return ok({ deleted: result.deleted });
  } catch (error) {
    return failure("сброс черновика", error);
  }
}
