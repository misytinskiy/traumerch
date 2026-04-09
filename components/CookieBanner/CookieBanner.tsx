"use client";

import { motion } from "framer-motion";
import Button from "../Button/Button";
import styles from "./CookieBanner.module.css";
import { useLanguage } from "../../contexts/LanguageContext";

interface CookieBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function CookieBanner({ onAccept, onReject }: CookieBannerProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      className={styles.cookieBanner}
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="dialog"
      aria-live="polite"
      aria-label={t.cookieBanner?.title ?? "Cookie notice"}
    >
      <div className={styles.bannerContent}>
        <div className={styles.textWrap}>
          <h2 className={styles.bannerTitle}>
            {t.cookieBanner?.title ?? "We use cookies"}
          </h2>
          <p className={styles.bannerText}>
            {t.cookieBanner?.text ??
              "We use essential cookies and analytics cookies to improve performance."}
          </p>
        </div>

        <div className={styles.bannerActions}>
          <Button
            size="medium"
            variant="transparent"
            padding="20px 32px"
            onClick={onReject}
          >
            {t.cookieBanner?.reject ?? "Reject"}
          </Button>
          <Button
            size="medium"
            variant="solid"
            padding="20px 32px"
            onClick={onAccept}
          >
            {t.cookieBanner?.accept ?? "Accept"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
