import { getDraftState } from "../../../../server/github/repo";
import { fail, failure, ok, settingsProblem } from "../_lib/respond";

/**
 * Что сейчас показывается и что изменено в черновике.
 *
 * Страницы админки статические — они не ходят в GitHub на сборке и не тянут
 * туда токен. Всё состояние приезжает сюда одним запросом уже из браузера,
 * после того как middleware проверил куку.
 */

export const runtime = "nodejs";
// Иначе Next имеет право посчитать ответ на сборке — а на сборке нет ни
// токена, ни смысла: черновик меняется каждые несколько минут.
export const dynamic = "force-dynamic";

export async function GET() {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  try {
    const state = await getDraftState();
    return ok({
      draft: {
        exists: state.exists,
        branch: state.branch,
        baseBranch: state.baseBranch,
        changedSlots: state.changedSlots,
      },
      entries: state.media.slots,
    });
  } catch (error) {
    return failure("чтение состояния черновика", error);
  }
}
