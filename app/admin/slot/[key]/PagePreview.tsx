"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { objectPosition, type Focal } from "../../_lib/focal";
import adminStyles from "../../admin.module.css";
import styles from "./slot.module.css";

/**
 * Превью уровня 2: настоящая страница сайта с подставленными фотографиями.
 *
 * Рамка своего же origin, поэтому до документа внутри можно дотянуться
 * напрямую — скрипта в самой странице не нужно. Заголовки уже разрешают
 * встраивание в себя (SAMEORIGIN / frame-ancestors 'self').
 *
 * Ширина переключается между десктопом и телефоном и не подделывается: CSS
 * страницы отрабатывает сам, то есть видно настоящую кадрировку, а не её
 * имитацию в квадратике админки.
 */

export type PreviewOverride = {
  src: string;
  srcSet?: string;
  /**
   * undefined — object-position не трогаем.
   *
   * Это важнее, чем кажется: у части слотов кадр задаёт CSS-класс страницы
   * (карточки команды), и запись «50% 50%» инлайном перебила бы его. Тогда
   * превью показывало бы не то, что получится после публикации.
   */
  focal?: Focal;
};

type Props = {
  page: string;
  overrides: Record<string, PreviewOverride>;
  onClose: () => void;
};

const WIDTHS = { desktop: 1440, mobile: 390 } as const;
const HEIGHTS = { desktop: 900, mobile: 780 } as const;

type Mode = keyof typeof WIDTHS;

/** Отметка, что этот адрес уже подставлен: без неё наблюдатель зациклится. */
const APPLIED = "data-admin-preview";

export default function PagePreview({ page, overrides, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("desktop");
  const [scale, setScale] = useState(1);
  const [nonce, setNonce] = useState(0);

  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Подстановка должна работать и из наблюдателя, который переживает
  // перерисовки: замыкание на старом объекте подставляло бы прошлое фото.
  const current = useRef(overrides);
  current.current = overrides;

  const apply = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;

    for (const [key, override] of Object.entries(current.current)) {
      const nodes = doc.querySelectorAll<HTMLImageElement>(
        `img[data-slot="${key}"]`
      );
      nodes.forEach((node) => {
        if (node.getAttribute(APPLIED) === override.src) return;
        // Метку ставим ДО подмены: иначе собственное изменение src разбудит
        // наблюдателя, тот снова подставит — и так до зависания вкладки.
        node.setAttribute(APPLIED, override.src);

        if (override.srcSet) node.srcset = override.srcSet;
        else node.removeAttribute("srcset");
        node.src = override.src;

        if (override.focal) {
          node.style.objectPosition = objectPosition(override.focal);
        }
      });
    }
  }, []);

  // Страница дорисовывает часть картинок лениво и клонирует слайды карусели,
  // поэтому одного load недостаточно — следим за появлением новых узлов.
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;

    let observer: MutationObserver | null = null;

    const onLoad = () => {
      apply();
      const doc = iframe.contentDocument;
      if (!doc) return;
      observer?.disconnect();
      observer = new MutationObserver(() => apply());
      observer.observe(doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "srcset"],
      });
    };

    iframe.addEventListener("load", onLoad);
    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [apply, nonce, mode]);

  // Смена точки кадра или файла должна долетать до уже открытой рамки.
  useEffect(() => {
    apply();
  }, [apply, overrides]);

  // Десктопная ширина в 1440px в панель админки не влезает — уменьшаем
  // целиком вместе со страницей, чтобы вёрстка осталась десктопной.
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const measure = () =>
      setScale(Math.min(1, node.clientWidth / WIDTHS[mode]));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <div className={adminStyles.overlay} role="dialog" aria-modal="true">
      <div className={styles.previewWindow}>
        <div className={styles.previewBar}>
          <div className={styles.previewTitle}>
            Страница {page}
            <span className={styles.previewNote}>
              с черновыми фотографиями — так это увидят посетители
            </span>
          </div>
          <div className={adminStyles.actions}>
            <button
              type="button"
              className={`${mode === "desktop" ? adminStyles.button : adminStyles.secondary} ${adminStyles.small}`}
              onClick={() => setMode("desktop")}
            >
              Компьютер
            </button>
            <button
              type="button"
              className={`${mode === "mobile" ? adminStyles.button : adminStyles.secondary} ${adminStyles.small}`}
              onClick={() => setMode("mobile")}
            >
              Телефон
            </button>
            <button
              type="button"
              className={`${adminStyles.secondary} ${adminStyles.small}`}
              onClick={() => setNonce((value) => value + 1)}
            >
              Обновить
            </button>
            <button
              type="button"
              className={`${adminStyles.secondary} ${adminStyles.small}`}
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className={styles.previewStage} ref={stage}>
          <div
            className={styles.previewScaler}
            // Рамка уменьшена трансформацией, а она не занимает места в потоке.
            // Без явных размеров узкий телефонный кадр прижимался бы к левому
            // краю, а полоса прокрутки считала бы страницу шире, чем она есть.
            style={{ width: WIDTHS[mode] * scale, height: HEIGHTS[mode] * scale }}
          >
            <iframe
              key={`${mode}-${nonce}`}
              ref={frame}
              className={styles.previewFrame}
              src={page}
              title={`Превью страницы ${page}`}
              style={{
                width: WIDTHS[mode],
                height: HEIGHTS[mode],
                transform: `scale(${scale})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
