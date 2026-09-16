import type { CSSProperties } from "react";

import mediaData from "../../content/media.json";
import { getSlot } from "../../content/slots";

type MediaVariant = { w: number; src: string };

type MediaEntry = {
  src: string;
  w: number;
  h: number;
  /**
   * Точка кадра в процентах. Пишется в object-position.
   * Отсутствует => инлайн-стиль не выставляется и object-position остаётся
   * за CSS-классом. Так замена <Image> на <img> не сдвигает вёрстку там,
   * где класс уже задаёт свой object-position (например, карточки команды).
   */
  focal?: { x: number; y: number };
  variants?: MediaVariant[];
};

const media = mediaData as { version: number; slots: Record<string, MediaEntry> };

type MediaImageProps = {
  /** Ключ из content/slots.ts */
  slot: string;
  /** Переопределяет alt из реестра — нужно для локализованных блоков. */
  alt?: string;
  className?: string;
  /** Переопределяет sizes из реестра. */
  sizes?: string;
  /** Аналог fill у next/image: растянуть по родителю с position: relative. */
  fill?: boolean;
  /** Грузить сразу, а не лениво. */
  priority?: boolean;
  /** Для не-fill случаев: сохраняем те же значения, что стояли у next/image. */
  width?: number;
  height?: number;
  style?: CSSProperties;
};

const FILL_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

export default function MediaImage({
  slot,
  alt,
  className,
  sizes,
  fill,
  priority,
  width,
  height,
  style,
}: MediaImageProps) {
  const definition = getSlot(slot);
  const entry = media.slots[slot];

  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `MediaImage: слот "${slot}" отсутствует в content/media.json. ` +
          `Запусти scripts/build-media-json.mjs.`
      );
    }
    return null;
  }

  const srcSet = entry.variants?.length
    ? entry.variants.map((variant) => `${variant.src} ${variant.w}w`).join(", ")
    : undefined;

  const resolvedStyle: CSSProperties = {
    ...(fill ? FILL_STYLE : null),
    ...(entry.focal
      ? { objectPosition: `${entry.focal.x}% ${entry.focal.y}%` }
      : null),
    ...style,
  };

  return (
    <img
      src={entry.src}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? definition?.sizes) : undefined}
      alt={alt ?? definition?.alt ?? ""}
      className={className}
      // При fill размеры задаёт родитель — как у next/image.
      width={fill ? undefined : (width ?? entry.w)}
      height={fill ? undefined : (height ?? entry.h)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={Object.keys(resolvedStyle).length ? resolvedStyle : undefined}
    />
  );
}

/** Прямой доступ к записи слота — для случаев, где нужен только URL. */
export const getMediaSrc = (slot: string): string | undefined =>
  media.slots[slot]?.src;
