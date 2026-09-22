"use client";

import type { MouseEvent } from "react";

import { focalFromPoint, objectPosition, type Focal } from "../../_lib/focal";
import styles from "./slot.module.css";

type Props = {
  title: string;
  hint: string;
  /** Пропорции места на странице — ровно те, что в content/slots.ts. */
  shape: { w: number; h: number };
  src: string;
  focal: Focal;
  /** true — точку кадра клиент задал сам, показываем метку. */
  marked: boolean;
  onPick: (focal: Focal) => void;
};

/**
 * Рамка в пропорциях места на странице.
 *
 * object-fit: cover и object-position здесь те же, что у настоящей картинки на
 * сайте, поэтому обрезка видна как есть. Десктоп и мобильный показываются
 * рядом и оба сразу: у части слотов пропорции заметно разные, и точка кадра,
 * удачная для широкой полосы, режет лицо в вертикальной плитке.
 *
 * Клик считается от прямоугольника рамки, а не от события над картинкой:
 * поверх лежит метка, и offsetX над ней означал бы совсем другое.
 */
export default function CropPreview({
  title,
  hint,
  shape,
  src,
  focal,
  marked,
  onPick,
}: Props) {
  const pick = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onPick(
      focalFromPoint(box, {
        x: event.clientX - box.left,
        y: event.clientY - box.top,
      })
    );
  };

  return (
    <figure className={styles.crop}>
      <figcaption className={styles.cropTitle}>
        {title}
        <span className={styles.cropHint}>{hint}</span>
      </figcaption>
      <div
        className={styles.cropBox}
        style={{ aspectRatio: `${shape.w} / ${shape.h}` }}
        onClick={pick}
        role="presentation"
      >
        <img
          className={styles.cropImage}
          src={src}
          alt=""
          style={{ objectPosition: objectPosition(focal) }}
          draggable={false}
        />
        {marked ? (
          <span
            className={styles.cropMark}
            style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </figure>
  );
}
