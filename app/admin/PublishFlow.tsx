"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./admin.module.css";
import { fetchLiveMedia, publishDraft } from "./_lib/client";
import { slotsWord } from "./_lib/format";

/**
 * Публикация и ожидание, пока сайт действительно обновится.
 *
 * Между коммитом и новой версией сайта проходит одна-две минуты пересборки.
 * Это свойство схемы, а не задержка ответа, и молчать о нём нельзя: клиент
 * открывает сайт, видит старую фотографию и жмёт «Опубликовать» ещё раз — а
 * это второй коммит и вторая сборка на ровном месте.
 *
 * Поэтому окно не закрывается сразу. Оно остаётся на экране и ждёт, пока
 * отпечаток реестра у отвечающего деплоя не сменится, — это единственный
 * честный признак, что сайт уже новый. Появление коммита в GitHub таким
 * признаком не является: он есть мгновенно, а сайт ещё старый.
 */

/** Как часто спрашиваем. Чаще смысла нет, сборка всё равно минуты. */
const POLL_MS = 5_000;
/** Сколько ждём, прежде чем сказать честное «что-то затянулось». */
const WAIT_LIMIT_MS = 6 * 60_000;
/** Столько ждём, если отпечаток «до» получить не удалось и сверять не с чем. */
const BLIND_WAIT_MS = 2 * 60_000;

type Stage = "idle" | "confirm" | "publishing" | "waiting" | "done" | "late" | "nothing";

type Props = {
  changedSlots: string[];
  labelOf: (key: string) => string;
  busy: boolean;
  /** Перечитать состояние: после публикации черновика больше нет. */
  onPublished: () => void;
};

const mmss = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export default function PublishFlow({
  changedSlots,
  labelOf,
  busy,
  onPublished,
}: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [publishedSlots, setPublishedSlots] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);

  // Ожидание переживает перерисовки, но не должно пережить уход со страницы.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const waiting = stage === "waiting";
  useEffect(() => {
    if (!waiting) return;
    const startedAt = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  /**
   * Состояние перечитываем не сразу после коммита, а когда сайт уже новый.
   *
   * Сразу — нельзя: черновика в этот момент уже нет, и список начнёт брать
   * фотографии по обычным адресам /media/..., которых на ещё не пересобранном
   * сайте нет. Клиент увидел бы пачку битых картинок ровно в ту минуту, когда
   * ему важнее всего, что всё прошло хорошо.
   */
  const waitForSite = useCallback(
    async (before: string | null) => {
      const startedAt = Date.now();
      const limit = before === null ? BLIND_WAIT_MS : WAIT_LIMIT_MS;

      while (alive.current && Date.now() - startedAt < limit) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        if (!alive.current) return;

        if (before === null) continue;

        try {
          const now = await fetchLiveMedia();
          if (now.fingerprint !== before) {
            onPublished();
            setStage("done");
            return;
          }
        } catch {
          // Пока деплой переключается, запрос может не пройти — это часть
          // нормального хода событий, а не повод сдаваться.
        }
      }

      if (alive.current) {
        onPublished();
        setStage("late");
      }
    },
    [onPublished]
  );

  const start = useCallback(async () => {
    setError(null);
    setWarning(null);
    setStage("publishing");

    // Отпечаток снимаем ДО коммита: после публикации сравнивать уже не с чем.
    let before: string | null = null;
    try {
      before = (await fetchLiveMedia()).fingerprint;
    } catch {
      before = null;
    }

    try {
      const result = await publishDraft();

      if (!result.published) {
        onPublished();
        setStage("nothing");
        return;
      }

      setPublishedSlots(result.slots);
      if (!result.draftReset) {
        setWarning(
          "Изменения опубликованы, но черновик убрать не удалось. " +
            "Он не мешает — просто нажмите «Сбросить черновик», когда сайт обновится."
        );
      }
      setStage("waiting");
      void waitForSite(before);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Не получилось опубликовать. Попробуйте ещё раз."
      );
      setStage("confirm");
    }
  }, [onPublished, waitForSite]);

  const close = useCallback(() => {
    setStage("idle");
    setError(null);
    setWarning(null);
  }, []);

  const count = changedSlots.length;
  const locked = stage === "publishing" || stage === "waiting";

  return (
    <>
      <button
        type="button"
        className={styles.button}
        disabled={busy || count === 0 || locked}
        onClick={() => setStage("confirm")}
      >
        Опубликовать
      </button>

      {stage === "idle" ? null : (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.dialog}>
            {stage === "confirm" ? (
              <>
                <h2 className={styles.dialogTitle}>Опубликовать изменения?</h2>
                <p className={styles.dialogText}>
                  На сайт уедет {count} {slotsWord(count)}. Это одно обновление
                  сайта: после него новые фотографии увидят все посетители.
                </p>
                <div className={styles.dialogList}>
                  {changedSlots.map((key) => (
                    <div key={key}>{labelOf(key)}</div>
                  ))}
                </div>
                {error ? <p className={styles.error}>{error}</p> : null}
                <div className={styles.dialogActions}>
                  <button type="button" className={styles.secondary} onClick={close}>
                    Отмена
                  </button>
                  <button type="button" className={styles.button} onClick={start}>
                    Да, опубликовать
                  </button>
                </div>
              </>
            ) : null}

            {stage === "publishing" ? (
              <>
                <h2 className={styles.dialogTitle}>Отправляем изменения…</h2>
                <p className={styles.dialogText}>
                  Не закрывайте страницу, это займёт несколько секунд.
                </p>
              </>
            ) : null}

            {stage === "waiting" ? (
              <>
                <h2 className={styles.dialogTitle}>Изменения приняты</h2>
                <p className={styles.dialogText}>
                  Сайт сейчас пересобирается — обычно это одна-две минуты.
                  Повторно нажимать ничего не нужно: всё уже отправлено.
                  Ждём: {mmss(elapsed)}
                </p>
                {warning ? <p className={styles.warning}>{warning}</p> : null}
              </>
            ) : null}

            {stage === "done" ? (
              <>
                <h2 className={styles.dialogTitle}>Готово, сайт обновился</h2>
                <p className={styles.dialogText}>
                  Новые фотографии ({publishedSlots.length} {slotsWord(publishedSlots.length)})
                  уже видны посетителям. Если на открытой вкладке сайта осталась
                  старая картинка — обновите её страницу.
                </p>
                {warning ? <p className={styles.warning}>{warning}</p> : null}
                <div className={styles.dialogActions}>
                  <button type="button" className={styles.button} onClick={close}>
                    Закрыть
                  </button>
                </div>
              </>
            ) : null}

            {stage === "late" ? (
              <>
                <h2 className={styles.dialogTitle}>Изменения отправлены</h2>
                <p className={styles.dialogText}>
                  Мы не дождались подтверждения, что сайт уже пересобрался.
                  Сами изменения записаны и никуда не денутся — скорее всего,
                  сборка просто задерживается. Откройте сайт через несколько
                  минут: фотографии должны обновиться.
                </p>
                {warning ? <p className={styles.warning}>{warning}</p> : null}
                <div className={styles.dialogActions}>
                  <button type="button" className={styles.button} onClick={close}>
                    Понятно
                  </button>
                </div>
              </>
            ) : null}

            {stage === "nothing" ? (
              <>
                <h2 className={styles.dialogTitle}>Публиковать нечего</h2>
                <p className={styles.dialogText}>
                  Неопубликованных изменений не нашлось — возможно, их уже
                  опубликовали из другого окна. Сайт не трогали.
                </p>
                <div className={styles.dialogActions}>
                  <button type="button" className={styles.button} onClick={close}>
                    Закрыть
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
