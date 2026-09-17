"use client";

import styles from "./ProductDetails.module.css";
import {
  productPhotoSrcSet,
  productPhotoUrl,
} from "../../shared/productPhoto";
import type { PhotoVariants } from "./types";

export default function ProductGallery({
  isLoading,
  productId,
  mainPhotoId,
  thumbnailPhotos,
  desktopThumbnailPhotos,
  selectedPhotoIndex,
  onThumbnailClick,
  onDotClick,
  sliderRef,
  onSliderScroll,
  selectedColor,
  imageAlt,
}: {
  isLoading: boolean;
  productId?: string;
  mainPhotoId: string | null;
  thumbnailPhotos: PhotoVariants[];
  desktopThumbnailPhotos: PhotoVariants[];
  selectedPhotoIndex: number;
  onThumbnailClick: (index: number) => void;
  onDotClick: (index: number) => void;
  sliderRef: React.RefObject<HTMLDivElement | null>;
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
          ) : productId && mainPhotoId ? (
            <div className={`${styles.mainImage} ${styles.imageWrap}`}>
              <img
                src={productPhotoUrl(productId, mainPhotoId, 1280)}
                srcSet={productPhotoSrcSet(productId, mainPhotoId)}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                alt={imageAlt}
                decoding="async"
                className={styles.imageContent}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
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
                <img
                  src={
                    productId && photo.id
                      ? productPhotoUrl(productId, photo.id, 960)
                      : undefined
                  }
                  srcSet={
                    productId && photo.id
                      ? productPhotoSrcSet(productId, photo.id)
                      : undefined
                  }
                  sizes="100vw"
                  alt={imageAlt}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={styles.imageContent}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
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
          : desktopThumbnailPhotos.length > 0
          ? desktopThumbnailPhotos.map((photo, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.thumbnail} ${styles.imageWrap}`}
                onClick={() => onThumbnailClick(index)}
                aria-label={`Secondary photo ${index + 1}`}
              >
                <img
                  src={
                    productId && photo.id
                      ? productPhotoUrl(productId, photo.id, 320)
                      : undefined
                  }
                  sizes="(max-width: 768px) 25vw, 96px"
                  alt={imageAlt}
                  loading="lazy"
                  decoding="async"
                  className={styles.imageContent}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
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
