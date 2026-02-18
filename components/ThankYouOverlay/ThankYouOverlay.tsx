"use client";

import { useState } from "react";
import styles from "./ThankYouOverlay.module.css";

interface ThankYouOverlayProps {
  title: string;
  description: string;
  onClose: () => void;
}

export default function ThankYouOverlay({
  title,
  description,
  onClose,
}: ThankYouOverlayProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 450);
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`}
    >
      <div className={`${styles.panel} ${isClosing ? styles.panelClosing : ""}`}>
        <main
          className={`${styles.main} ${isClosing ? styles.mainClosing : ""}`}
        >
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close thank you overlay"
            >
              <svg
                width="76"
                height="76"
                viewBox="0 0 76 76"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_352_3469)">
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
          </div>
          <p className={styles.description}>{description}</p>
          <div className={styles.imageContainer}>
            <video className={styles.thankYouImage} autoPlay muted playsInline>
              <source src="/thankYou.webm" type="video/webm" />
            </video>
          </div>
        </main>
      </div>
    </div>
  );
}
