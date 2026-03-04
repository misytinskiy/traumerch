"use client";

import Image from "next/image";
import styles from "./ProductDetails.module.css";
import type { PhotoVariants } from "./types";

export default function ProductGallery({
  isLoading,
  mainPhotoUrl,
  thumbnailPhotos,
  selectedPhotoIndex,
  onThumbnailClick,
  onDotClick,
  sliderRef,
  onSliderScroll,
  selectedColor,
  imageAlt,
}: {
  isLoading: boolean;
  mainPhotoUrl: string | null;
  thumbnailPhotos: PhotoVariants[];
  selectedPhotoIndex: number;
  onThumbnailClick: (index: number) => void;
  onDotClick: (index: number) => void;
  sliderRef: React.RefObject<HTMLDivElement>;
  onSliderScroll: () => void;
  selectedColor: string;
  imageAlt: string;
}) {
  return (
    <div className={styles.imageSection}>
      <div className={styles.mainImageContainer}>
        <div className={styles.desktopMainImage}>
          {isLoading ? (
            <div className={`${styles.mainImage} ${styles.skeletonBlock}`} />
          ) : mainPhotoUrl ? (
            <div className={`${styles.mainImage} ${styles.imageWrap}`}>
              <Image
                src={mainPhotoUrl}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                className={styles.imageContent}
                priority
              />
            </div>
          ) : (
            <div
              className={styles.mainImage}
              style={{ backgroundColor: selectedColor }}
            />
          )}
        </div>

        <div
          className={styles.mobileSlider}
          ref={sliderRef}
          onScroll={onSliderScroll}
        >
          {isLoading ? (
            <div className={`${styles.mobileSlide} ${styles.skeletonBlock}`} />
          ) : thumbnailPhotos.length > 0 ? (
            thumbnailPhotos.map((photo, index) => (
              <div key={index} className={`${styles.mobileSlide} ${styles.imageWrap}`}>
                <Image
                  src={photo.large || photo.full || photo.small || ""}
                  alt={imageAlt}
                  fill
                  sizes="100vw"
                  className={styles.imageContent}
                  priority={index === 0}
                />
              </div>
            ))
          ) : (
            <div
              className={styles.mobileSlide}
              style={{ backgroundColor: selectedColor }}
            />
          )}
        </div>

        {thumbnailPhotos.length > 1 && (
          <div className={styles.mobileDots} aria-hidden>
            {thumbnailPhotos.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.mobileDot} ${
                  index === selectedPhotoIndex ? styles.mobileDotActive : ""
                }`}
                onClick={() => onDotClick(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className={styles.thumbnails}>
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className={`${styles.thumbnail} ${styles.skeletonBlock}`}
              />
            ))
          : thumbnailPhotos.length > 0
          ? thumbnailPhotos.map((photo, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.thumbnail} ${styles.imageWrap}`}
                onClick={() => onThumbnailClick(index)}
                aria-label={`Secondary photo ${index + 1}`}
              >
                <Image
                  src={photo.large || photo.full || photo.small || ""}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 768px) 25vw, 96px"
                  className={styles.imageContent}
                  loading="lazy"
                />
              </button>
            ))
          : Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className={styles.thumbnail}
                style={{ backgroundColor: "#e0e0e0" }}
              />
            ))}
      </div>
    </div>
  );
}
