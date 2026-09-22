"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SLOTS, SLOT_GROUPS } from "../../content/slots";
import PublishFlow from "./PublishFlow";
import SlotCard from "./SlotCard";
import styles from "./admin.module.css";
import {
  discardDraft,
  fetchAdminState,
  handleFailure,
  logout,
} from "./_lib/client";
import { changedLabel, slotsWord } from "./_lib/format";
import type { AdminState } from "./_lib/types";

/**
 * Список всех мест сайта, где можно заменить фотографию.
 *
 * Страница сознательно статическая, а состояние приезжает запросом из
 * браузера. Серверный компонент, читающий GitHub, сделал бы /admin
 * динамической — а вместе с ней в сборке появился бы второй динамический
 * маршрут, и проверка «весь сайт остался готовым HTML» перестала бы что-либо
 * значить. Плюс токен не нужен на сборке.
 */

const LABELS = new Map(SLOTS.map((slot) => [slot.key, slot.label]));

export default function AdminScreen() {
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const load = useCallback(async () => {
    try {
      setState(await fetchAdminState());
      setError(null);
    } catch (failure) {
      setError(handleFailure(failure));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = useMemo(
    () => new Set(state?.draft.changedSlots ?? []),
    [state]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      needle
        ? SLOTS.filter(
            (slot) =>
              slot.label.toLowerCase().includes(needle) ||
              slot.key.toLowerCase().includes(needle)
          )
        : SLOTS,
    [needle]
  );

  const reset = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await discardDraft();
      setConfirmReset(false);
      await load();
    } catch (failure) {
      setError(handleFailure(failure));
    } finally {
      setBusy(false);
    }
  }, [load]);

  const labelOf = useCallback((key: string) => LABELS.get(key) ?? key, []);
  const changedSlots = state?.draft.changedSlots ?? [];

  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Фотографии сайта</h1>
              <p className={styles.subtitle}>
                Всего мест: {SLOTS.length}. Выберите любое, чтобы заменить фотографию.
              </p>
            </div>
            <div className={styles.actions}>
              <PublishFlow
                changedSlots={changedSlots}
                labelOf={labelOf}
                busy={busy || !state}
                onPublished={load}
              />
              <button
                type="button"
                className={styles.danger}
                disabled={busy || changedSlots.length === 0}
                onClick={() => setConfirmReset(true)}
              >
                Сбросить черновик
              </button>
              <button type="button" className={styles.secondary} onClick={logout}>
                Выйти
              </button>
            </div>
          </div>

          <div className={changedSlots.length ? styles.draftBarActive : styles.draftBar}>
            <div>
              <div className={styles.draftText}>
                {state ? changedLabel(changedSlots.length) : "Загружаем состояние…"}
              </div>
              <p className={styles.draftHint}>
                {changedSlots.length
                  ? "Изменения сохранены, но на сайте их пока нет. Они появятся после публикации."
                  : "Всё, что вы видите, сейчас показано на сайте."}
              </p>
            </div>
            <input
              className={styles.search}
              type="search"
              value={query}
              placeholder="Поиск по названию"
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Поиск места на сайте"
            />
          </div>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </header>

        {!state && !error ? (
          <p className={styles.centered}>Загружаем список фотографий…</p>
        ) : null}

        {state
          ? SLOT_GROUPS.map((group) => {
              const slots = visible.filter((slot) => slot.group === group);
              if (slots.length === 0) return null;
              return (
                <section className={styles.group} key={group}>
                  <h2 className={styles.groupTitle}>{group}</h2>
                  <p className={styles.groupCount}>
                    {slots.length} {slotsWord(slots.length)}
                  </p>
                  <div className={styles.grid}>
                    {slots.map((slot) => (
                      <SlotCard
                        key={slot.key}
                        slotKey={slot.key}
                        label={slot.label}
                        entry={state.entries[slot.key]}
                        changed={changed.has(slot.key)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          : null}

        {state && visible.length === 0 ? (
          <p className={styles.centered}>
            По запросу «{query}» ничего не нашлось.
          </p>
        ) : null}
      </div>

      {confirmReset ? (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>Сбросить черновик?</h2>
            <p className={styles.dialogText}>
              Все несохранённые на сайт замены ({changedSlots.length}{" "}
              {slotsWord(changedSlots.length)}) исчезнут, и вернуть их будет
              нечем. Сайт при этом не изменится — на нём и так старые фотографии.
            </p>
            <div className={styles.dialogList}>
              {changedSlots.map((key) => (
                <div key={key}>{labelOf(key)}</div>
              ))}
            </div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondary}
                disabled={busy}
                onClick={() => setConfirmReset(false)}
              >
                Оставить
              </button>
              <button
                type="button"
                className={styles.danger}
                disabled={busy}
                onClick={reset}
              >
                {busy ? "Сбрасываем…" : "Да, сбросить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
