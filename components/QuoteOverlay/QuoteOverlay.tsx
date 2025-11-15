"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuoteForm from "../QuoteForm/QuoteForm";
import CTA from "../CTA/CTA";
import Footer from "../Footer/Footer";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import styles from "./QuoteOverlay.module.css";
import { useRouter } from "next/navigation";

export default function QuoteOverlay() {
  const { isOpen, closeQuote } = useQuoteOverlay();
  const router = useRouter();

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
              CLOSE
            </button>
            <div className={styles.contentWrapper}>
              <QuoteForm
                onSubmit={() => {
                  closeQuote();
                  router.push("/quote/thank-you");
                }}
              />
              <CTA />
              <Footer />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
