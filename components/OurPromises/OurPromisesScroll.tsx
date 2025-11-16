"use client";

import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./OurPromisesScroll.module.css";

export default function OurPromisesScroll() {
  const { t } = useLanguage();
  const promises = t.promises.items;
  const [activeIndex, setActiveIndex] = useState(0);
  const [leftStyles, setLeftStyles] = useState<React.CSSProperties>({});
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftSideRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    contentRefs.current = contentRefs.current.slice(0, promises.length);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          const indexAttr = visibleEntry.target.getAttribute("data-index");
          const index = Number(indexAttr);
          if (!Number.isNaN(index)) {
            setActiveIndex(index);
          }
        }
      },
      {
        root: null,
        threshold: 0.35,
        rootMargin: "-15% 0px -15% 0px",
      }
    );

    contentRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [promises]);

  const updateLeftPosition = useCallback(() => {
    const leftSide = leftSideRef.current;
    const sticky = stickyRef.current;
    if (!leftSide || !sticky) return;

    const headerOffset = 100;
    const leftRect = leftSide.getBoundingClientRect();
    const scrollY = window.scrollY;
    const start = scrollY + leftRect.top;
    const end = start + leftSide.offsetHeight - sticky.offsetHeight;
    const current = scrollY + headerOffset;

    if (current <= start) {
      setLeftStyles({ position: "relative", top: 0, left: 0, width: "100%" });
    } else if (current >= end) {
      setLeftStyles({
        position: "absolute",
        top: leftSide.offsetHeight - sticky.offsetHeight,
        left: 0,
        width: "100%",
      });
    } else {
      setLeftStyles({
        position: "fixed",
        top: headerOffset,
        left: leftRect.left,
        width: leftRect.width,
      });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => updateLeftPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateLeftPosition);
    updateLeftPosition();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateLeftPosition);
    };
  }, [updateLeftPosition]);

  const handleMenuClick = (index: number) => {
    const target = contentRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveIndex(index);
    }
  };

  const renderDescription = (text: string) =>
    text.split("*").map((part, idx) => (
      <Fragment key={idx}>
        {idx === 0 ? part : <span className={styles.asteriskText}>*{part}</span>}
      </Fragment>
    ));

  return (
    <section className={styles.ourPromisesScroll}>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <div ref={leftSideRef} className={styles.leftSide}>
            <div ref={stickyRef} style={leftStyles} className={styles.leftSticky}>
              <div className={styles.promisesList}>
                {promises.map((promise, index) => (
                  <button
                    key={promise.heading}
                    type="button"
                    className={`${styles.promiseItem} ${
                      index === activeIndex ? styles.active : ""
                    }`}
                    onClick={() => handleMenuClick(index)}
                  >
                    <span className={styles.promiseTitle}>{promise.heading}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.rightSide}>
            {promises.map((promise, index) => (
              <article
                key={`${promise.heading}-${index}`}
                ref={(el) => {
                  contentRefs.current[index] = el ?? null;
                }}
                data-index={index}
                className={`${styles.contentBlock} ${
                  index === activeIndex ? styles.contentBlockActive : ""
                }`}
              >
                <div className={styles.imagePlaceholder}>
                  <div className={styles.promiseImage}>
                    <img
                      src={`/promises/${index + 1}.png`}
                      alt={promise.heading}
                      className={styles.promiseImageTag}
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </div>

                <h4 className={styles.phrase}>{promise.phrase}</h4>

                <p className={styles.description}>{renderDescription(promise.description)}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
