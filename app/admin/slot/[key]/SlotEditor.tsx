"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CropPreview from "./CropPreview";
import PagePreview, { type PreviewOverride } from "./PagePreview";
import adminStyles from "../../admin.module.css";
import styles from "./slot.module.css";
import {
  discardSlot,
  fetchAdminState,
  handleFailure,
  logout,
  saveSlot,
  updateFocal,
} from "../../_lib/client";
import { entrySrc, entrySrcSet } from "../../_lib/draftMedia";
import { CENTER, sameFocal, type Focal } from "../../_lib/focal";
import { formatBytes, formatSize } from "../../_lib/format";
import { checkResolution } from "../../_lib/resolution";
import { prepareUpload, type PreparedUpload } from "../../_lib/upload";
import type { AdminState } from "../../_lib/types";

type SlotProps = {
  key: string;
  label: string;
  group: string;
  page: string;
  shape: { w: number; h: number };
  mobileShape: { w: number; h: number } | null;
};

type Props = {
  slot: SlotProps;
  /** Ширина, которая нужна этому месту. Считает сервер, см. neededWidth.server.ts. */
  neededWidth: number;
};

export default function SlotEditor({ slot, neededWidth }: Props) {
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [picked, setPicked] = useState<PreparedUpload | null>(null);
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const [focal, setFocal] = useState<Focal>(CENTER);
  const [focalSet, setFocalSet] = useState(false);
  const [showPage, setShowPage] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  // Точку кадра подставляем из реестра ровно один раз: иначе перечитывание
  // состояния после сохранения затирало бы то, что клиент только что выбрал.
  const focalReady = useRef(false);

  /**
   * Адрес выбранного файла живёт в ref, а не только в состоянии.
   *
   * Объектный адрес держит весь файл в памяти вкладки, пока его не отпустят,
   * и отпустить его должен тот, кто создал. Делать это в очистке эффекта
   * нельзя: в режиме разработки React прогоняет эффекты дважды и отобрал бы
   * адрес у картинки, которую клиент в этот момент смотрит.
   */
  const previewUrl = useRef<string | null>(null);
  const showBlob = useCallback((blob: Blob | null) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = blob ? URL.createObjectURL(blob) : null;
    setPickedUrl(previewUrl.current);
  }, []);
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    []
  );

  const load = useCallback(async () => {
    try {
      const next = await fetchAdminState();
      setState(next);
      setError(null);
      if (!focalReady.current) {
        focalReady.current = true;
        const saved = next.entries[slot.key]?.focal;
        setFocal(saved ?? CENTER);
        setFocalSet(Boolean(saved));
      }
    } catch (failure) {
      setError(handleFailure(failure));
    }
  }, [slot.key]);

  useEffect(() => {
    void load();
  }, [load]);

  const entry = state?.entries[slot.key];
  const changed = Boolean(state?.draft.changedSlots.includes(slot.key));
  const savedFocal = entry?.focal;

  const previewSrc = pickedUrl ?? (entry ? entrySrc(entry, changed) : null);
  const sourceWidth = picked?.width ?? entry?.w ?? 0;
  const resolution = checkResolution(neededWidth, sourceWidth);

  const focalDiffers =
    focalSet !== Boolean(savedFocal) ||
    (focalSet && !sameFocal(focal, savedFocal));
  const canSave = Boolean(picked) || (Boolean(entry) && focalDiffers);

  const choose = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setNotice(null);
    setReading(true);
    try {
      const prepared = await prepareUpload(file);
      setPicked(prepared);
      setPickedName(file.name);
      showBlob(prepared.blob);
    } catch {
      setError(
        "Не получилось открыть этот файл. Выберите обычную фотографию — " +
          "JPEG, PNG, WebP или HEIC с телефона."
      );
    } finally {
      setReading(false);
    }
  }, [showBlob]);

  const save = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (picked) {
        const result = await saveSlot(
          slot.key,
          { blob: picked.blob, fileName: picked.fileName },
          focalSet ? focal : null
        );
        setNotice(
          `Сохранено в черновик: ${formatSize(result.entry.w, result.entry.h)}, ` +
            `${result.files} ${result.files === 1 ? "размер" : "размера"} под разные экраны. ` +
            "На сайте это появится после публикации."
        );
        setPicked(null);
        setPickedName(null);
        showBlob(null);
        if (fileInput.current) fileInput.current.value = "";
      } else {
        await updateFocal(slot.key, focalSet ? focal : null);
        setNotice(
          "Точка кадра сохранена в черновик. На сайте это появится после публикации."
        );
      }
      await load();
    } catch (failure) {
      setError(handleFailure(failure));
    } finally {
      setBusy(false);
    }
  }, [focal, focalSet, load, picked, showBlob, slot.key]);

  const revert = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await discardSlot(slot.key);
      setPicked(null);
      setPickedName(null);
      showBlob(null);
      if (fileInput.current) fileInput.current.value = "";
      focalReady.current = false;
      await load();
      setNotice("Вернули то, что показано на сайте.");
    } catch (failure) {
      setError(handleFailure(failure));
    } finally {
      setBusy(false);
    }
  }, [load, showBlob, slot.key]);

  /**
   * Что подставить в настоящую страницу.
   *
   * Берём весь черновик, а не только текущий слот: страница показывает
   * соседние фотографии, и если они тоже заменены, смотреть надо на итоговый
   * вид целиком.
   */
  const overrides = useMemo(() => {
    const map: Record<string, PreviewOverride> = {};
    if (!state) return map;

    for (const key of state.draft.changedSlots) {
      const item = state.entries[key];
      if (!item) continue;
      map[key] = {
        src: entrySrc(item, true),
        srcSet: entrySrcSet(item, true),
        focal: item.focal,
      };
    }

    const own = state.entries[slot.key];
    if (pickedUrl) {
      // Ещё не сохранённый файл: srcset взять неоткуда, да и незачем —
      // это один кадр на весь диапазон ширин.
      map[slot.key] = { src: pickedUrl, focal: focalSet ? focal : undefined };
    } else if (own) {
      map[slot.key] = {
        src: entrySrc(own, changed),
        srcSet: entrySrcSet(own, changed),
        focal: focalSet ? focal : undefined,
      };
    }

    return map;
  }, [changed, focal, focalSet, pickedUrl, slot.key, state]);

  return (
    <main className={adminStyles.screen}>
      <div className={adminStyles.inner}>
        <header className={adminStyles.header}>
          <div className={adminStyles.headerRow}>
            <div>
              <h1 className={adminStyles.title}>{slot.label}</h1>
              <p className={adminStyles.subtitle}>
                {slot.group} · показывается на странице {slot.page}
              </p>
            </div>
            <div className={adminStyles.actions}>
              <Link className={adminStyles.secondary} href="/admin">
                К списку
              </Link>
              <button type="button" className={adminStyles.secondary} onClick={logout}>
                Выйти
              </button>
            </div>
          </div>

          {changed ? (
            <div className={adminStyles.draftBarActive}>
              <div>
                <div className={adminStyles.draftText}>
                  Здесь лежит несохранённая на сайт фотография
                </div>
                <p className={adminStyles.draftHint}>
                  Посетители пока видят прежнюю. Опубликовать всё разом можно на
                  странице со списком.
                </p>
              </div>
              <button
                type="button"
                className={adminStyles.danger}
                disabled={busy}
                onClick={revert}
              >
                Вернуть как было
              </button>
            </div>
          ) : null}

          {error ? (
            <p className={adminStyles.error} role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p className={adminStyles.success}>{notice}</p> : null}
          {resolution.warning ? (
            <p className={adminStyles.warning}>{resolution.warning}</p>
          ) : null}
        </header>

        <div className={styles.layout}>
          <div>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Фотография</h2>
              <label className={styles.field}>
                <input
                  ref={fileInput}
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  disabled={busy || reading}
                  onChange={(event) => void choose(event.target.files?.[0])}
                />
              </label>

              <p className={styles.facts}>
                <span className={styles.factName}>Нужная ширина: </span>
                {neededWidth} пикселей
                <br />
                <span className={styles.factName}>Сейчас: </span>
                {entry ? formatSize(entry.w, entry.h) : "фотографии нет"}
                {picked ? (
                  <>
                    <br />
                    <span className={styles.factName}>Выбрано: </span>
                    {formatSize(picked.width, picked.height)},{" "}
                    {formatBytes(picked.blob.size)}
                    {picked.reencoded ? " (уменьшено в браузере)" : ""}
                    <br />
                    <span className={styles.factName}>Файл: </span>
                    {pickedName}
                  </>
                ) : null}
              </p>

              <div className={styles.buttons}>
                <button
                  type="button"
                  className={adminStyles.button}
                  disabled={busy || reading || !canSave}
                  onClick={save}
                >
                  {busy ? "Сохраняем…" : "Сохранить в черновик"}
                </button>
                <button
                  type="button"
                  className={adminStyles.secondary}
                  disabled={!previewSrc}
                  onClick={() => setShowPage(true)}
                >
                  Посмотреть на странице
                </button>
              </div>
              {reading ? (
                <p className={adminStyles.draftHint}>Готовим файл к отправке…</p>
              ) : null}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Точка кадра</h2>
              <p className={styles.facts}>
                Фотография почти никогда не совпадает по пропорциям с местом на
                странице, поэтому её края обрезаются. Нажмите на снимок в том
                месте, которое должно остаться видно всегда.
              </p>
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={adminStyles.secondary}
                  disabled={!focalSet}
                  onClick={() => {
                    setFocalSet(false);
                    setFocal(CENTER);
                  }}
                >
                  Убрать точку
                </button>
              </div>
            </section>
          </div>

          <div>
            {previewSrc ? (
              <div className={styles.crops}>
                <CropPreview
                  title="Как на компьютере"
                  hint={`${slot.shape.w} × ${slot.shape.h}`}
                  shape={slot.shape}
                  src={previewSrc}
                  focal={focal}
                  marked={focalSet}
                  onPick={(next) => {
                    setFocal(next);
                    setFocalSet(true);
                  }}
                />
                {slot.mobileShape ? (
                  <CropPreview
                    title="Как на телефоне"
                    hint={`${slot.mobileShape.w} × ${slot.mobileShape.h}`}
                    shape={slot.mobileShape}
                    src={previewSrc}
                    focal={focal}
                    marked={focalSet}
                    onPick={(next) => {
                      setFocal(next);
                      setFocalSet(true);
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <div className={styles.empty}>
                {state
                  ? "Для этого места ещё нет фотографии. Выберите файл слева."
                  : "Загружаем текущую фотографию…"}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPage && previewSrc ? (
        <PagePreview
          page={slot.page}
          overrides={overrides}
          onClose={() => setShowPage(false)}
        />
      ) : null}
    </main>
  );
}
