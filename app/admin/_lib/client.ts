/**
 * Обращения админки к своим роутам.
 *
 * Весь разбор ответов собран здесь по одной причине: клиенту нельзя показывать
 * ни код статуса, ни текст исключения. Роуты уже отвечают готовой русской
 * фразой в поле error — задача этого модуля достать её, а на всё остальное
 * (сеть отвалилась, пришёл HTML вместо JSON) подставить внятную замену.
 */

import type {
  AdminState,
  ApiFailure,
  LiveMedia,
  PublishResult,
  SaveSlotResult,
} from "./types";

/**
 * Сессия кончилась. Отдельный класс, потому что реакция на это не «показать
 * ошибку», а «увести на вход»: иначе клиент смотрит на красную плашку и не
 * понимает, что достаточно войти заново.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super("Сессия закончилась. Войдите заново.");
    this.name = "SessionExpiredError";
  }
}

const fallbackMessage = (status: number): string => {
  if (status === 413) return "Файл слишком большой — выберите фотографию поменьше.";
  if (status === 404) return "Такого раздела нет. Обновите страницу.";
  if (status === 429) return "Слишком много запросов подряд. Подождите минуту.";
  if (status >= 500) return "Сервер не смог выполнить действие. Попробуйте ещё раз.";
  return "Действие не выполнено. Попробуйте ещё раз.";
};

const parse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) throw new SessionExpiredError();

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Тело не JSON — например, страница ошибки платформы. Ниже подставим
    // замену по статусу: показывать кусок HTML клиенту незачем.
  }

  if (!response.ok) {
    const error = (data as ApiFailure | null)?.error;
    throw new Error(
      typeof error === "string" && error ? error : fallbackMessage(response.status)
    );
  }

  return data as T;
};

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new Error("Сервер не ответил. Проверьте соединение и попробуйте снова.");
  }
  return parse<T>(response);
};

export const fetchAdminState = (): Promise<AdminState> =>
  request<AdminState>("/api/admin/state");

export const saveSlot = (
  slotKey: string,
  upload: { blob: Blob; fileName: string },
  focal: { x: number; y: number } | null
): Promise<SaveSlotResult> => {
  const form = new FormData();
  form.append("file", upload.blob, upload.fileName);
  // Точка кадра уходит строкой: FormData умеет только строки и файлы, а
  // отдельный JSON-запрос после загрузки означал бы два коммита вместо одного.
  if (focal) form.append("focal", JSON.stringify(focal));

  return request<SaveSlotResult>(`/api/admin/slot/${encodeURIComponent(slotKey)}`, {
    method: "POST",
    body: form,
  });
};

/**
 * Смена только точки кадра, без нового файла.
 *
 * Отдельный вызов, потому что «поправить кадр у уже загруженной фотографии» —
 * совершенно обычное желание, а заставлять ради этого заново искать и
 * загружать исходник значит гарантированно получить вопрос «а где взять тот
 * файл, который вы уже показываете?».
 */
export const updateFocal = (
  slotKey: string,
  focal: { x: number; y: number } | null
): Promise<{ changed: boolean }> =>
  request<{ changed: boolean }>(`/api/admin/slot/${encodeURIComponent(slotKey)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ focal }),
  });

export const discardSlot = (slotKey: string): Promise<{ changed: boolean }> =>
  request<{ changed: boolean }>(`/api/admin/slot/${encodeURIComponent(slotKey)}`, {
    method: "DELETE",
  });

export const discardDraft = (): Promise<{ deleted: boolean }> =>
  request<{ deleted: boolean }>("/api/admin/draft", { method: "DELETE" });

export const publishDraft = (): Promise<PublishResult> =>
  request<PublishResult>("/api/admin/publish", { method: "POST" });

/**
 * Отпечаток реестра у того деплоя, который отвечает прямо сейчас.
 *
 * На него опирается ожидание после публикации: значение меняется ровно тогда,
 * когда новая сборка начала обслуживать запросы. Метка времени в адресе — от
 * промежуточных кешей, которые иначе отдавали бы старый ответ и ожидание
 * никогда бы не закончилось.
 */
export const fetchLiveMedia = (): Promise<LiveMedia> =>
  request<LiveMedia>(`/api/admin/live-media?t=${Date.now()}`);

/**
 * Что показать клиенту после неудачи.
 *
 * Кончившаяся сессия обрабатывается здесь же, а не в каждом экране: реакция на
 * неё одна — увести на вход. Если оставить это на совесть вызывающего кода,
 * рано или поздно где-нибудь появится красная плашка «Сессия закончилась» без
 * всякой возможности что-то с этим сделать.
 */
export const handleFailure = (error: unknown): string => {
  if (error instanceof SessionExpiredError) {
    window.location.assign("/admin/login");
    return error.message;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Не получилось выполнить действие. Попробуйте ещё раз.";
};

export const logout = async (): Promise<void> => {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch {
    // Кука HttpOnly, погасить её из JS нельзя. Если запрос не прошёл —
    // всё равно уводим на вход: там будет видно, действует сессия или нет.
  }
  window.location.assign("/admin/login");
};
