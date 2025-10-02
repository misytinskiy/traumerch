"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../Button/Button";
import styles from "./OurPromises.module.css";

export default function OurPromises() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-advance when section is visible
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 6);
    }, 4000000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  const promises = t.promises.items;

  return (
    <section ref={sectionRef} className={styles.ourPromises}>
      <div className={styles.container}>
        {/* Top left text */}
        <div className={styles.topLeftText}>{t.promises.topText}</div>

        {/* Main content */}
        <div className={styles.mainContent}>
          {/* Left side - List of promises */}
          <div className={styles.leftSide}>
            <div className={styles.promisesList}>
              {promises.map((promise, index) => (
                <motion.div
                  key={index}
                  className={`${styles.promiseItem} ${
                    index === activeIndex ? styles.active : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                  whileHover={{ opacity: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className={styles.promiseTitle}>{promise.heading}</h3>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right side - Content area */}
          <div className={styles.rightSide}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                className={styles.contentBlock}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {/* Image placeholder */}
                <div className={styles.imagePlaceholder}>
                  <div className={styles.graySquare}></div>
                </div>

                {/* Phrase */}
                <h4 className={styles.phrase}>
                  {promises[activeIndex].phrase}
                </h4>

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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
