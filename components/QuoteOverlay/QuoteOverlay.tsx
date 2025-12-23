"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineWidget } from "react-calendly";
import Image from "next/image";
import Button from "../Button/Button";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./QuoteOverlay.module.css";

interface QuoteFormData {
  name: string;
  preferredMessenger: string;
  requestType: "services" | "merchandise";
  service: string;
  description: string;
  file: File | null;
}

const messengers = [
  { id: 1, name: "WhatsApp", icon: "/quoteIcons/whatsapp.svg" },
  { id: 2, name: "Instagram", icon: "/quoteIcons/instagram.svg" },
  { id: 3, name: "Facebook", icon: "/quoteIcons/facebook.svg" },
];

const servicesList = ["Service 1", "Service 2", "Service 3", "Service 4"];

export default function QuoteOverlay() {
  const { isOpen, closeQuote } = useQuoteOverlay();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    preferredMessenger: "",
    requestType: "services",
    service: "",
    description: "",
    file: null,
  });
  const [selectedMessenger, setSelectedMessenger] = useState<number | null>(
    null
  );
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add("quote-overlay-open");
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.classList.remove("quote-overlay-open");
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
      // Reset form when closing
      setFormData({
        name: "",
        preferredMessenger: "",
        requestType: "services",
        service: "",
        description: "",
        file: null,
      });
      setSelectedMessenger(null);
      setSelectedService(null);
      setShowThankYou(false);
    }
    return () => {
      // Cleanup: restore scroll position if overlay is closed
      const scrollY = document.body.style.top;
      document.body.classList.remove("quote-overlay-open");
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowThankYou(true);
    // You can add form submission logic here
  };

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
            <div className={styles.contentWrapper}>
              {showThankYou ? (
                <div className={styles.thankYouContent}>
                  <h1 className={styles.thankYouTitle}>
                    {t.quote?.thankYouTitle || "Thank you"}
                  </h1>
                  <p className={styles.thankYouDescription}>
                    {t.quote?.thankYouDescription ||
                      "Let's bring your ideas to life — from first design to delivery, we make the process simple and reliable."}
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.main}>
                    <div className={styles.titleRow}>
                      <h1 className={styles.mainTitle}>
                        {t.quote?.mainTitle || "Talk or type"} <br />—{" "}
                        {t.quote?.mainTitleEnd || "it's up to you"}
                      </h1>
                      <button
                        className={styles.closeButton}
                        onClick={closeQuote}
                        aria-label="Close quote form"
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

                    <div className={styles.content}>
                      <div className={styles.leftColumn}>
                        <h2 className={styles.formTitle}>
                          {t.quote?.formTitle ||
                            "From Messenger to Quote — it's that simple."}
                        </h2>

                        <form className={styles.form} onSubmit={handleSubmit}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              {t.quote?.nameLabel ||
                                t.quote?.namePlaceholder ||
                                "Name"}
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder={t.quote?.namePlaceholder || "Name"}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              {t.quote?.preferredMessenger ||
                                "Preferred Messenger"}
                            </label>
                            <div className={styles.messengerButtons}>
                              {messengers.map((messenger) => (
                                <button
                                  key={messenger.id}
                                  type="button"
                                  className={`${styles.messengerButton} ${
                                    selectedMessenger === messenger.id
                                      ? styles.messengerButtonActive
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setSelectedMessenger(messenger.id)
                                  }
                                  aria-label={messenger.name}
                                >
                                  <Image
                                    src={messenger.icon}
                                    alt={messenger.name}
                                    width={20}
                                    height={20}
                                    className={`${styles.messengerIcon} ${styles.messengerIconColored}`}
                                  />
                                  <Image
                                    src={messenger.icon}
                                    alt={messenger.name}
                                    width={20}
                                    height={20}
                                    className={`${styles.messengerIcon} ${styles.messengerIconWhite}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              {t.quote?.yourRequest || "Your request"}
                            </label>
                            <div className={styles.toggleButtons}>
                              <button
                                type="button"
                                className={`${styles.toggleButton} ${
                                  formData.requestType === "services"
                                    ? styles.toggleButtonActive
                                    : ""
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    requestType: "services",
                                  }))
                                }
                              >
                                {(
                                  t.quote?.services || "Services"
                                ).toUpperCase()}
                              </button>
                              <button
                                type="button"
                                className={`${styles.toggleButton} ${
                                  formData.requestType === "merchandise"
                                    ? styles.toggleButtonActive
                                    : ""
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    requestType: "merchandise",
                                  }))
                                }
                              >
                                {t.quote?.merchandise || "MERCHANDISE"}
                              </button>
                            </div>
                          </div>

                          {formData.requestType === "services" && (
                            <div className={styles.formGroup}>
                              <label className={styles.label}>
                                {t.quote?.services || "Services"}
                              </label>
                              <div className={styles.serviceButtons}>
                                {servicesList.map((service) => (
                                  <button
                                    key={service}
                                    type="button"
                                    className={`${styles.serviceButton} ${
                                      selectedService === service
                                        ? styles.serviceButtonActive
                                        : ""
                                    }`}
                                    onClick={() => setSelectedService(service)}
                                  >
                                    {service.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className={styles.formGroup}>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              placeholder={
                                t.quote?.description || "Description"
                              }
                              className={styles.textarea}
                              rows={6}
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label
                              htmlFor="file-upload"
                              className={styles.fileUploadLabel}
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={styles.uploadIcon}
                              >
                                <path
                                  d="M12 15V3M12 3L8 7M12 3L16 7M4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13"
                                  stroke="#999999"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className={styles.fileUploadText}>
                                {t.quote?.fileUpload || "FILE UPLOAD"}
                              </span>
                            </label>
                            <input
                              id="file-upload"
                              type="file"
                              onChange={handleFileChange}
                              className={styles.fileInput}
                              accept="image/*,.pdf,.doc,.docx"
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="solid"
                            padding="24px 48px"
                            arrow="white"
                            className={styles.submitButton}
                          >
                            {t.quote?.send || "Add to quote"}
                          </Button>
                        </form>
                      </div>

                      <div className={styles.rightColumn}>
                        <h2 className={styles.rightTitle}>
                          {t.quote?.rightTitle || "Let's talk it through"}
                        </h2>
                        <div className={styles.calendlyWidget}>
                          <InlineWidget url="https://calendly.com/traumerch/30min" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
