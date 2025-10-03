"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./OurPromisesScroll.module.css";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function OurPromisesScroll() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrollSectionActive, setIsScrollSectionActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const promisesRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentBlockRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const lastWheelTimeRef = useRef(0);
  const promises = t.promises.items;

  // Функция для плавного переключения контента
  const switchToItem = useCallback(
    (index: number) => {
      if (isScrollingRef.current || index === activeIndex) return;

      isScrollingRef.current = true;
      setActiveIndex(index);

      // Анимация исчезновения текущего контента
      const currentItem = contentBlockRef.current;
      const nextItem = contentBlockRef.current;

      if (currentItem && nextItem) {
        const tl = gsap.timeline();

        // Исчезновение с масштабированием и blur
        tl.to(currentItem, {
          opacity: 0,
          scale: 0.95,
          filter: "blur(4px)",
          duration: 0.2,
          ease: "power2.out",
        });

        // Появление с масштабированием и blur
        tl.fromTo(
          nextItem,
          {
            opacity: 0,
            scale: 1.05,
            filter: "blur(4px)",
          },
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.2,
            ease: "power2.out",
          },
          0.1
        );

        // Разблокируем скролл после анимации и сбрасываем эффекты
        tl.call(() => {
          isScrollingRef.current = false;
          // Убеждаемся, что все эффекты сброшены
          if (contentBlockRef.current) {
            gsap.set(contentBlockRef.current, {
              scale: 1,
              filter: "blur(0px)",
            });
          }
        });
      }
    },
    [activeIndex]
  );

  // Обработчик wheel события
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const delta = e.deltaY;
      const threshold = 50; // Увеличили порог для тачпада
      const now = Date.now();
      const timeSinceLastWheel = now - lastWheelTimeRef.current;

      if (!isScrollSectionActive || isScrollingRef.current) return;

      // Дебаунс для предотвращения множественных срабатываний
      if (timeSinceLastWheel < 100) return; // 100ms между переключениями (быстрее)

      e.preventDefault();

      if (Math.abs(delta) >= threshold) {
        lastWheelTimeRef.current = now;

        if (delta > 0) {
          // Скролл вниз - следующий элемент
          const nextItem = Math.min(activeIndex + 1, promises.length - 1);
          if (nextItem !== activeIndex) {
            switchToItem(nextItem);
          }
        } else {
          // Скролл вверх - предыдущий элемент
          const prevItem = Math.max(activeIndex - 1, 0);
          if (prevItem !== activeIndex) {
            switchToItem(prevItem);
          }
        }
      }
    },
    [activeIndex, isScrollSectionActive, switchToItem, promises.length]
  );

  useEffect(() => {
    // Добавляем обработчик wheel события
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const section = sectionRef.current;

    // Create ScrollTrigger for the section with fixed height
    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=600vh",
      pin: true,
      pinSpacing: false,
      onEnter: () => {
        setIsScrollSectionActive(true);
      },
      onLeave: () => {
        setIsScrollSectionActive(false);
      },
      onEnterBack: () => {
        setIsScrollSectionActive(true);
      },
      onLeaveBack: () => {
        setIsScrollSectionActive(false);
      },
    });

    // Initialize promises list items
    promisesRef.current.forEach((ref, index) => {
      if (ref) {
        if (index === 0) {
          gsap.set(ref, { opacity: 1, scale: 1 });
        } else {
          gsap.set(ref, { opacity: 0.4, scale: 0.95 });
        }
      }
    });

    // Инициализируем контент-блок с нормальными значениями
    if (contentBlockRef.current) {
      gsap.set(contentBlockRef.current, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
      });
    }

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [promises.length]); // Намеренно не включаем activeIndex, чтобы избежать пересоздания ScrollTrigger

  // Separate effect for animating based on activeIndex
  useEffect(() => {
    promisesRef.current.forEach((ref, index) => {
      if (ref) {
        if (index === activeIndex) {
          gsap.to(ref, {
            opacity: 1,
            scale: 1,
            duration: 0.2,
            ease: "power2.out",
          });
        } else {
          gsap.to(ref, {
            opacity: 0.4,
            scale: 0.95,
            duration: 0.2,
            ease: "power2.out",
          });
        }
      }
    });

    // Animate content block - убираем анимацию y для предотвращения скачков
    if (contentBlockRef.current) {
      gsap.killTweensOf(contentBlockRef.current);
      gsap.to(contentBlockRef.current, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, [activeIndex]);

  return (
    <section ref={sectionRef} className={styles.ourPromisesScroll}>
      <div className={styles.container}>
        {/* Top left text */}
        <div className={styles.topLeftText}>{t.promises.topText}</div>

        {/* Main content */}
        <div ref={contentRef} className={styles.mainContent}>
          {/* Left side - List of promises */}
          <div className={styles.leftSide}>
            <div className={styles.promisesList}>
              {promises.map((promise, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    promisesRef.current[index] = el;
                  }}
                  className={`${styles.promiseItem} ${
                    index === activeIndex ? styles.active : ""
                  }`}
                >
                  <h3 className={styles.promiseTitle}>{promise.heading}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Content area */}
          <div className={styles.rightSide}>
            <div ref={contentBlockRef} className={styles.contentBlock}>
              {/* Image placeholder */}
              <div className={styles.imagePlaceholder}>
                <div className={styles.graySquare}></div>
              </div>

              {/* Phrase */}
              <h4 className={styles.phrase}>{promises[activeIndex].phrase}</h4>

              {/* Description */}
              <p className={styles.description}>
                {promises[activeIndex].description
                  .split("*")
                  .map((part, index) => {
                    if (index === 0) return part;
                    return (
                      <span key={index}>
                        <span className={styles.asteriskText}>*{part}</span>
                      </span>
                    );
                  })}
              </p>

              {/* See More button */}
              <div className={styles.buttonContainer}>
                <Button
                  variant="solid"
                  padding="32px 87px"
                  arrow="white"
                  size="small"
                >
                  SEE MORE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
