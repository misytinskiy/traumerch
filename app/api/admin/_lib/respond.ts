import { NextResponse } from "next/server";

import { describeError } from "../../../../server/diagnostics/redact";
import { GitHubError, GitHubNotFoundError } from "../../../../server/github/errors";

/**
 * Ответы роутов админки.
 *
 * Всё, что уходит в поле error, читает клиент — не разработчик. Поэтому здесь
 * нет ни кодов, ни имён исключений, ни строк стека: внутренности пишутся в
 * лог сервера, наружу идёт фраза, из которой понятно, что делать дальше.
 *
 * Отдельно про 401: его возвращает только middleware, когда кончилась сессия,
 * и админка по нему уводит на страницу входа. Поэтому чужие 401 (например,
 * «GitHub не принял токен») сюда пробрасывать нельзя — клиента выкинуло бы
 * на вход при совершенно другой поломке.
 */

export const ok = <T extends object>(payload: T) =>
  NextResponse.json({ ok: true, ...payload });

export const fail = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status });

/** Переменные окружения, без которых админка не может писать в репозиторий. */
const REQUIRED_SETTINGS = ["GITHUB_TOKEN", "GITHUB_REPO"] as const;

/**
 * Проверка настройки ДО обращения к репозиторию.
 *
 * Без неё ненастроенный стенд выдаёт ту же ошибку, что и упавший GitHub, и
 * владелец ищет проблему в сети вместо панели переменных окружения.
 */
export const settingsProblem = (): string | null => {
  const missing = REQUIRED_SETTINGS.filter((name) => !process.env[name]?.trim());
  if (missing.length === 0) return null;
  return (
    "Админка не настроена: на сервере не заданы " +
    missing.join(" и ") +
    ". Пока это не исправлено, менять фотографии нельзя."
  );
};

/**
 * Перевод исключения в ответ.
 *
 * Сообщения GitHubError писались для человека и уже по-русски («нет ветки
 * main», «проверьте GITHUB_TOKEN») — их показываем как есть, иначе владельцу
 * пришлось бы лезть в логи Vercel за тем, что уже известно.
 */
export const failure = (where: string, error: unknown) => {
  console.error(`[admin] ${where}`, describeError(error));

  if (error instanceof GitHubNotFoundError) {
    return fail(
      "В репозитории не нашлось того, что нужно для этой операции. " +
        "Проверьте настройки репозитория и веток.",
      502
    );
  }

  if (error instanceof GitHubError) {
    return fail(error.message, 502);
  }

  if (error instanceof Error && error.message) {
    return fail(`Не получилось: ${error.message}`, 500);
  }

  return fail("Не получилось выполнить действие. Попробуйте ещё раз.", 500);
};
