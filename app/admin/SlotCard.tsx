"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import styles from "./admin.module.css";
import { entrySrc, thumbSrc } from "./_lib/draftMedia";
import { formatBytes, formatSize } from "./_lib/format";
import type { SlotEntry } from "./_lib/types";

type Props = {
  slotKey: string;
  label: string;
  entry: SlotEntry | undefined;
  /** true — в черновике эта фотография отличается от опубликованной. */
  changed: boolean;
};

/**
 * Карточка слота в списке.
 *
 * Вес файла берётся отдельным запросом HEAD и только после того, как браузер
 * действительно загрузил миниатюру. В media.json размера в байтах нет, а
 * спрашивать вес всех ста пяти файлов сразу при открытии списка значит
 * потратить полсотни запросов на то, что клиент, скорее всего, даже не
 * пролистает. Ленивая загрузка миниатюр решает это сама: запрос уходит для
 * того, что доехало до экрана.
 */
export default function SlotCard({ slotKey, label, entry, changed }: Props) {
  const [bytes, setBytes] = useState<number | undefined>(undefined);

  // Смена черновика меняет адрес файла — старый вес перестаёт относиться к делу.
  useEffect(() => setBytes(undefined), [entry?.src]);

  const measure = useCallback(async () => {
    if (!entry) return;
    try {
      // Вес показываем у основного варианта — того, что реально уедет на
      // сайт. Миниатюра весит в разы меньше, и такая цифра только запутает.
      const response = await fetch(entrySrc(entry, changed), {
        method: "HEAD",
        cache: "force-cache",
      });
      // Без проверки ответа сюда попал бы размер тела ошибки: у неудачного
      // ответа content-length тоже есть, и он показался бы весом фотографии.
      if (!response.ok) return;
      const length = Number(response.headers.get("content-length"));
      if (Number.isFinite(length) && length > 0) setBytes(length);
    } catch {
      // Вес — справка, а не условие работы. Не узнали — покажем прочерк.
    }
  }, [entry, changed]);

  const src = entry ? thumbSrc(entry, changed) : null;

  return (
    <Link
      className={changed ? styles.cardChanged : styles.card}
      href={`/admin/slot/${encodeURIComponent(slotKey)}`}
    >
      <div className={styles.thumbBox}>
        {src ? (
          /* next/image здесь не к месту: варианты уже нарезаны конвейером, а
             черновые файлы лежат вне public, и оптимизатор их не найдёт. */
          <img
            className={styles.thumb}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={measure}
          />
        ) : (
          <div className={styles.thumbEmpty}>Фотография ещё не загружена</div>
        )}
        {changed ? <span className={styles.badge}>Изменено</span> : null}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardLabel}>{label}</div>
        <p className={styles.cardMeta}>
          {entry ? (
            <>
              {formatSize(entry.w, entry.h)} · {formatBytes(bytes)}
              <br />
              {slotKey}
            </>
          ) : (
            slotKey
          )}
        </p>
      </div>
    </Link>
  );
}
