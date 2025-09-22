"use client";

import { useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperRef } from "swiper";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./Gallery.module.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

const LeftArrow = () => (
  <svg
    width="54"
    height="54"
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="54"
      height="54"
      rx="27"
      transform="matrix(-1 0 0 1 54 0)"
      fill="black"
    />
    <path
      d="M23.0438 20.1121L16.1558 27.0001M16.1558 27.0001L23.0438 33.8881M16.1558 27.0001H37.8438"
      stroke="white"
      strokeWidth="1.378"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RightArrow = () => (
  <svg
    width="54"
    height="54"
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="54" height="54" rx="27" fill="black" />
    <path
      d="M30.9562 20.1121L37.8442 27.0001M37.8442 27.0001L30.9562 33.8881M37.8442 27.0001H16.1562"
      stroke="white"
      strokeWidth="1.378"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Gallery() {
  const { t } = useLanguage();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperRef | null>(null);

  // Create array of 6 images from squares folder
  const images = [
    { id: 1, src: "/squares/1.jpeg", alt: "Gallery image 1" },
    { id: 2, src: "/squares/2.png", alt: "Gallery image 2" },
    { id: 3, src: "/squares/3.jpeg", alt: "Gallery image 3" },
    { id: 4, src: "/squares/4.jpeg", alt: "Gallery image 4" },
    { id: 5, src: "/squares/5.png", alt: "Gallery image 5" },
    { id: 6, src: "/squares/6.jpeg", alt: "Gallery image 6" },
  ];

  const handlePrevClick = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNextClick = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  return (
    <section className={styles.gallery}>
      <div className={styles.header}>
        <SectionTitle maxWidth={500}>{t.gallery.title}</SectionTitle>

        <div className={styles.navigation}>
          <button
            ref={prevRef}
            className={styles.navButton}
            onClick={handlePrevClick}
            aria-label="Previous images"
          >
            <LeftArrow />
          </button>
          <button
            ref={nextRef}
            className={styles.navButton}
            onClick={handleNextClick}
            aria-label="Next images"
          >
            <RightArrow />
          </button>
        </div>
      </div>

      <div className={styles.swiperContainer}>
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={3}
          loop={true}
          speed={500}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            if (typeof swiper.params.navigation !== "boolean") {
              const navigation = swiper.params.navigation;
              if (navigation) {
                navigation.prevEl = prevRef.current;
                navigation.nextEl = nextRef.current;
              }
            }
          }}
          breakpoints={{
            320: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 15,
            },
            1200: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          }}
          className={styles.swiper}
        >
          {images.map((image) => (
            <SwiperSlide key={image.id} className={styles.swiperSlide}>
              <div className={styles.imageItem}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={614}
                  height={583}
                  priority={image.id <= 3}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
