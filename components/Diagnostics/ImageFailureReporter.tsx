"use client";

import { useEffect } from "react";

import { buildRetrySrcSet, buildRetryUrl } from "../../shared/imageRetry";

/**
 * Одна повторная попытка для картинки, которая не загрузилась, плюс отчёт о
 * том, чем дело кончилось.
 *
 * Слушатель один на весь сайт. Событие error у <img> не всплывает, но фаза
 * перехвата его видит, поэтому сюда попадают и next/image, и MediaImage, и
 * любой другой тег — без правки каждого места вызова.
 *
 * Зачем повтор: причина редких битых картинок пока не установлена, и повтор её
 * не устанавливает. Но он убирает симптом у посетителя и, главное, разделяет
 * случайный сбой («догрузилось со второй попытки») и постоянный («не грузится
 * вообще»). Это именно то различие, которого не хватало, чтобы понять, куда
 * смотреть дальше.
 */

const RETRY_DELAY_MS = 500;
/**
 * Разброс задержки. Когда на холодной загрузке падает сразу три десятка
 * картинок, дружный повтор в один момент воспроизводит ровно ту нагрузку,
 * из-за которой они, возможно, и упали.
 */
const RETRY_JITTER_MS = 1500;

/** Ровно одна повторная попытка на картинку. */
const MAX_ATTEMPTS = 1;

/** Потолок отчётов на загрузку страницы — на случай, если сеть отвалилась совсем. */
const MAX_REPORTS = 40;

type ReportPayload = {
  outcome: "recovered" | "failed";
  src: string;
  currentSrc: string;
  page: string;
  attempts: number;
  msToRetry?: number;
  connection?: string;
  visibility?: string;
  naturalWidth?: number;
};

const connectionType = (): string | undefined => {
  const connection = (
    navigator as Navigator & { connection?: { effectiveType?: string } }
  ).connection;
  return connection?.effectiveType;
};

/** Только путь: в query может лежать что угодно, включая чужие данные. */
const samePath = (value: string): string => {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return `external:${url.host}`;
    return `${url.pathname}${url.search}`;
  } catch {
    return "";
  }
};

export default function ImageFailureReporter() {
  useEffect(() => {
    const attempts = new WeakMap<HTMLImageElement, number>();
    const failedAt = new WeakMap<HTMLImageElement, number>();
    const timers = new Set<number>();
    let reportsSent = 0;

    const send = (payload: ReportPayload) => {
      if (reportsSent >= MAX_REPORTS) return;
      reportsSent += 1;

      const body = JSON.stringify(payload);

      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon?.("/api/image-diagnostics", blob)) return;
      } catch {
        // sendBeacon недоступен или отказал — пробуем обычным запросом.
      }

      void fetch("/api/image-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Отчёт о диагностике не должен ломать страницу ещё сильнее.
      });
    };

    const report = (
      image: HTMLImageElement,
      outcome: "recovered" | "failed",
      attempt: number
    ) => {
      const started = failedAt.get(image);
      send({
        outcome,
        src: samePath(image.getAttribute("src") ?? ""),
        currentSrc: samePath(image.currentSrc || ""),
        page: window.location.pathname,
        attempts: attempt,
        msToRetry: started ? Date.now() - started : undefined,
        connection: connectionType(),
        visibility: document.visibilityState,
        naturalWidth: image.naturalWidth,
      });
    };

    const retry = (image: HTMLImageElement, attempt: number) => {
      const origin = window.location.origin;
      const currentSrc = image.getAttribute("src") ?? "";
      const nextSrc = buildRetryUrl(currentSrc, attempt, origin);

      // Повторять нечего: пустой src, data:, чужой origin. Отчёт всё равно
      // полезен, но он уже отправлен вызывающим кодом.
      if (!nextSrc) return false;

      const currentSrcSet = image.getAttribute("srcset");
      if (currentSrcSet) {
        const nextSrcSet = buildRetrySrcSet(currentSrcSet, attempt, origin);
        if (nextSrcSet) {
          image.setAttribute("srcset", nextSrcSet);
        } else {
          // Переписать не вышло — убираем совсем, иначе браузер продолжит
          // выбирать источник из старого srcset и подменённый src не сработает.
          image.removeAttribute("srcset");
        }
      }

      const onLoad = () => {
        image.removeEventListener("load", onLoad);
        report(image, "recovered", attempt);
      };
      image.addEventListener("load", onLoad, { once: true });

      image.setAttribute("src", nextSrc);
      return true;
    };

    const handleError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;

      // Пустой src, data: или чужой адрес: повторять нечего, а отчёт по такому
      // ничего не расскажет — сервер его всё равно отбрасывает.
      if (!buildRetryUrl(target.getAttribute("src") ?? "", 1, window.location.origin)) {
        return;
      }

      const attempt = attempts.get(target) ?? 0;

      if (attempt >= MAX_ATTEMPTS) {
        report(target, "failed", attempt);
        return;
      }

      attempts.set(target, attempt + 1);
      failedAt.set(target, Date.now());

      const delay = RETRY_DELAY_MS + Math.random() * RETRY_JITTER_MS;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        // Картинку могли убрать со страницы, пока мы ждали.
        if (!target.isConnected) return;
        if (!retry(target, attempt + 1)) {
          report(target, "failed", attempt + 1);
        }
      }, delay);

      timers.add(timer);
    };

    window.addEventListener("error", handleError, true);

    return () => {
      window.removeEventListener("error", handleError, true);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return null;
}
