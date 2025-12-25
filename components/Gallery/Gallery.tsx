"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperRef } from "swiper";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./Gallery.module.css";

// Import Swiper styles
import "swiper/swiper-bundle.css";

const LeftArrow = () => (
  <svg
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect
      x="-0.5"
      y="-0.5"
      width="49"
      height="49"
      rx="24.5"
      transform="matrix(0 -1 -1 0 49 49)"
      stroke="currentColor"
    />
    <path
      d="M28.5357 31.3578C28.7231 31.1703 28.8284 30.916 28.8284 30.6508C28.8284 30.3857 28.7231 30.1314 28.5357 29.9438L23.5857 24.9938L28.5357 20.0438C28.7178 19.8552 28.8186 19.6026 28.8163 19.3404C28.8141 19.0782 28.7089 18.8274 28.5235 18.642C28.3381 18.4566 28.0873 18.3515 27.8251 18.3492C27.5629 18.3469 27.3103 18.4477 27.1217 18.6298L21.4647 24.2868C21.2772 24.4744 21.1719 24.7287 21.1719 24.9938C21.1719 25.259 21.2772 25.5133 21.4647 25.7008L27.1217 31.3578C27.3092 31.5453 27.5635 31.6506 27.8287 31.6506C28.0938 31.6506 28.3481 31.5453 28.5357 31.3578Z"
      fill="currentColor"
    />
  </svg>
);

const RightArrow = () => (
  <svg
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <rect
      x="0.5"
      y="49.5"
      width="49"
      height="49"
      rx="24.5"
      transform="rotate(-90 0.5 49.5)"
      stroke="currentColor"
    />
    <path
      d="M21.4643 31.3578C21.2769 31.1703 21.1716 30.916 21.1716 30.6508C21.1716 30.3857 21.2769 30.1314 21.4643 29.9438L26.4143 24.9938L21.4643 20.0438C21.2822 19.8552 21.1814 19.6026 21.1837 19.3404C21.1859 19.0782 21.2911 18.8274 21.4765 18.642C21.6619 18.4566 21.9127 18.3515 22.1749 18.3492C22.4371 18.3469 22.6897 18.4477 22.8783 18.6298L28.5353 24.2868C28.7228 24.4744 28.8281 24.7287 28.8281 24.9938C28.8281 25.259 28.7228 25.5133 28.5353 25.7008L22.8783 31.3578C22.6908 31.5453 22.4365 31.6506 22.1713 31.6506C21.9062 31.6506 21.6519 31.5453 21.4643 31.3578Z"
      fill="currentColor"
    />
  </svg>
);

export default function Gallery() {
  const { t, language } = useLanguage();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const mobilePrevRef = useRef<HTMLButtonElement>(null);
  const mobileNextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperRef | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldShowNavigation, setShouldShowNavigation] = useState(true);

  // Quotes array - 6 quotes (one will be used twice for images 1 and 6)
  const quotes = [
    {
      text: {
        en: "From brief to delivery, everything was smooth. The quality looked premium and consistent across every items",
        de: "Vom Briefing bis zur Lieferung lief alles reibungslos. Die Qualität wirkte hochwertig und über alle Artikeln hinweg absolut konsistent",
      },
      author: "Clara Rossi, Brand Manager",
    },
    {
      text: {
        en: "They handled last-minute changes without drama and still shipped on time. That reliability is rare",
        de: "Kurzfristige Änderungen haben sie ohne Stress umgesetzt und trotzdem pünktlich geliefert. Diese Verlässlichkeit ist selten",
      },
      author: "Amir Haddad, Event Producer",
    },
    {
      text: {
        en: "The team understood our brand guidelines instantly and nailed the details: colors, finishes, packaging, no back-and-forth",
        de: "Das Team hat unsere Brand Guidelines sofort verstanden und die Details perfekt getroffen: Farben, Veredelungen, Packaging, ganz ohne endloses Hin und He.",
      },
      author: "Sophie Laurent, Marketing Lead",
    },
    {
      text: {
        en: "We ordered a mixed welcome kit for new hires, and the unboxing experience was genuinely impressive. People loved it",
        de: "Wir haben ein gemischtes Welcome Kit für neue Mitarbeitende bestellt, und das Unboxing war wirklich beeindruckend. Alle waren begeistert",
      },
      author: "Olena Koval, People Operations Manager",
    },
    {
      text: {
        en: "Pricing was clear, communication was fast, and the final product matched the samples perfectly. Zero surprises",
        de: "Die Preise waren transparent, die Kommunikation schnell, und das Endprodukt entsprach den Mustern perfekt. Keine Überraschungen",
      },
      author: "Mateo Silva, Procurement Lead",
    },
    {
      text: {
        en: "They delivered samples in a week — faster than any supplier we've worked with.",
        de: "Sie haben Muster innerhalb einer Woche geliefert — schneller als jeder Lieferant, mit dem wir bisher gearbeitet haben.",
      },
      author: "Jonas Müller, Product Lead",
    },
  ];

  // Create array of 6 gallery images with quotes
  // Using quote index 0 twice (for images 1 and 6), last image uses index 5
  const images = Array.from({ length: 6 }, (_, index) => {
    // For index 0 (image 1), use quote index 0
    // For index 5 (image 6), use quote index 5 (Jonas Müller)
    // For others (index 1-4), use quote index 1-4
    const quoteIndex = index === 0 ? 0 : index === 5 ? 5 : index;
    const quote = quotes[quoteIndex];
    const currentLanguage = language || "en";
    const quoteText = currentLanguage === "de" ? quote.text.de : quote.text.en;

    return {
      id: index + 1,
      src: `/gallery/${index + 1}.jpg`,
      alt: `Gallery image ${index + 1}`,
      quote: quoteText,
      author: quote.author,
    };
  });

  // Commented out: previous 10 images structure
  // const images = Array.from({ length: 10 }, (_, index) => ({
  //   id: index + 1,
  //   src: "/frame.png",
  //   alt: `Gallery image ${index + 1}`,
  // }));

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 480);
      setShouldShowNavigation(width > 1000);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (swiperRef.current) {
      const navigation = swiperRef.current.params.navigation;
      if (typeof navigation !== "boolean" && navigation) {
        const prevEl = isMobile ? mobilePrevRef.current : prevRef.current;
        const nextEl = isMobile ? mobileNextRef.current : nextRef.current;

        if (prevEl && nextEl) {
          navigation.prevEl = prevEl;
          navigation.nextEl = nextEl;
          swiperRef.current.navigation.destroy();
          swiperRef.current.navigation.init();
          swiperRef.current.navigation.update();
        }
      }
    }
  }, [isMobile]);

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

        {shouldShowNavigation && (
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
        )}
      </div>

      <div className={styles.swiperContainer}>
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            // Update navigation after Swiper is initialized
            setTimeout(() => {
              const navigation = swiper.params.navigation;
              if (typeof navigation !== "boolean" && navigation) {
                const prevEl = isMobile
                  ? mobilePrevRef.current
                  : prevRef.current;
                const nextEl = isMobile
                  ? mobileNextRef.current
                  : nextRef.current;

                if (prevEl && nextEl) {
                  navigation.prevEl = prevEl;
                  navigation.nextEl = nextEl;
                  swiper.navigation.destroy();
                  swiper.navigation.init();
                  swiper.navigation.update();
                }
              }
            }, 0);
          }}
          modules={[Navigation, Autoplay]}
          spaceBetween={20}
          slidesPerView={3}
          loop={true}
          speed={500}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          navigation={
            shouldShowNavigation
              ? {
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }
              : false
          }
          onBeforeInit={(swiper) => {
            if (
              shouldShowNavigation &&
              typeof swiper.params.navigation !== "boolean"
            ) {
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
                <div className={styles.overlay}>
                  <div className={styles.quote}>
                    <p className={styles.quoteText}>
                      &ldquo;{image.quote}&rdquo;
                    </p>
                    <p className={styles.quoteAuthor}>{image.author}</p>
                  </div>
                </div>
                {/* Commented out: Quotes for removed images (7-10)
                Previously there were 10 images, now reduced to 6.
                If needed, individual quotes can be added here for each image.
                */}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Mobile navigation is commented out */}
      {/* <div className={styles.mobileNavigation}>
        <button
          ref={mobilePrevRef}
          className={styles.navButton}
          onClick={handlePrevClick}
          aria-label="Previous images"
        >
          <LeftArrow />
        </button>
        <button
          ref={mobileNextRef}
          className={styles.navButton}
          onClick={handleNextClick}
          aria-label="Next images"
        >
          <RightArrow />
        </button>
      </div> */}
    </section>
  );
}
