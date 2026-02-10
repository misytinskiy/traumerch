"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "./QuoteButton.module.css";

interface QuoteButtonProps {
  onClick: () => void;
  hasCartItems: boolean;
  itemCount: number;
  text: string;
  isMobile?: boolean;
}

export default function QuoteButton({
  onClick,
  hasCartItems,
  itemCount,
  text,
  isMobile = false,
}: QuoteButtonProps) {
  const buttonClassName = `${styles.quoteButton} ${
    hasCartItems ? styles.quoteButtonWithCart : ""
  } ${isMobile ? styles.mobile : ""}`;

  return (
    <motion.button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <AnimatePresence mode="wait">
        {hasCartItems ? (
          <motion.span
            key="with-cart"
            className={styles.quoteButtonInner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {text}
            <motion.span
              className={styles.quoteBadge}
              aria-label={`${itemCount} items`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: 0.1,
              }}
            >
              {itemCount}
            </motion.span>
          </motion.span>
        ) : (
          <motion.span
            key="without-cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
