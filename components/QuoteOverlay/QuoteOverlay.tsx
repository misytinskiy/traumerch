"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuoteForm from "../QuoteForm/QuoteForm";
import CTA from "../CTA/CTA";
import Footer from "../Footer/Footer";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import styles from "./QuoteOverlay.module.css";

export default function QuoteOverlay() {
  const { isOpen, closeQuote } = useQuoteOverlay();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("quote-overlay-open");
    } else {
      document.body.classList.remove("quote-overlay-open");
    }
    return () => document.body.classList.remove("quote-overlay-open");
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeQuote}
        >
          <motion.div
            className={styles.panel}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={() => {
                closeQuote();
              }}
              aria-label="Close quote form"
            >
              <svg
                width="76"
                height="76"
                viewBox="0 0 76 76"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_352_3469)">
                  <rect
                    x="16.5059"
                    y="56.8086"
                    width="57"
                    height="3.8"
                    transform="rotate(-45 16.5059 56.8086)"
                    fill="black"
                  />
                  <rect
                    x="16.5059"
                    y="19.1914"
                    width="3.8"
                    height="57"
                    transform="rotate(-45 16.5059 19.1914)"
                    fill="black"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_352_3469">
                    <rect width="76" height="76" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
            <div className={styles.contentWrapper}>
              <QuoteForm />
              <CTA />
              <Footer />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
