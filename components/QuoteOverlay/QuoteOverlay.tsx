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
  email: string;
  preferredMessenger: string;
  messengerContact: string;
  requestType: "services" | "merchandise";
  service: string;
  description: string;
  file: File | null;
}

const messengers = [
  { id: 1, name: "WhatsApp", icon: "/quoteIcons/whatsapp.svg" },
  { id: 2, name: "Email", icon: "/quoteIcons/email.svg" },
  { id: 3, name: "Facebook", icon: "/quoteIcons/facebook.svg" },
  { id: 4, name: "Teams", icon: "/quoteIcons/teams.svg" },
];

const servicesList = ["Service 1", "Service 2", "Service 3", "Service 4"];

export default function QuoteOverlay() {
  const { isOpen, closeQuote } = useQuoteOverlay();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    email: "",
    preferredMessenger: "",
    messengerContact: "",
    requestType: "merchandise",
    service: "",
    description: "",
    file: null,
  });
  const [selectedMessenger, setSelectedMessenger] = useState<number | null>(
    null
  );
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    messengerContact?: string;
  }>({});

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
        email: "",
        preferredMessenger: "",
        messengerContact: "",
        requestType: "merchandise",
        service: "",
        description: "",
        file: null,
      });
      setSelectedMessenger(null);
      setSelectedService(null);
      setShowThankYou(false);
      setErrors({});
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
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation - allows numbers, spaces, +, -, (, )
    const phoneRegex = /^[\d\s\+\-\(\)]{7,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (selectedMessenger) {
      const messenger = messengers.find((m) => m.id === selectedMessenger);
      if (
        messenger &&
        messenger.name !== "Email" &&
        messenger.name !== "Teams"
      ) {
        if (!formData.messengerContact.trim()) {
          newErrors.messengerContact = "Contact information is required";
        } else if (
          messenger.name === "WhatsApp" &&
          !validatePhone(formData.messengerContact)
        ) {
          newErrors.messengerContact = "Please enter a valid phone number";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowThankYou(true);
      // You can add form submission logic here
    }
  };

  const handleMessengerSelect = (messengerId: number) => {
    setSelectedMessenger(messengerId);
    setFormData((prev) => ({
      ...prev,
      messengerContact: "",
      preferredMessenger:
        messengers.find((m) => m.id === messengerId)?.name || "",
    }));
    if (errors.messengerContact) {
      setErrors((prev) => ({ ...prev, messengerContact: undefined }));
    }
  };

  const getMessengerPlaceholder = (messengerName: string): string => {
    switch (messengerName) {
      case "WhatsApp":
        return "Phone number*";
      case "Facebook":
        return "@username*";
      case "Teams":
        return "Email address*";
      default:
        return "";
    }
  };

  const shouldShowMessengerInput = (messengerId: number | null): boolean => {
    if (!messengerId) return false;
    const messenger = messengers.find((m) => m.id === messengerId);
    return messenger?.name !== "Email" && messenger?.name !== "Teams";
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
                  <div className={styles.thankYouTitleRow}>
                    <h1 className={styles.thankYouTitle}>
                      {t.quote?.thankYouTitle || "Thank you"}
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
                  <p className={styles.thankYouDescription}>
                    {t.quote?.thankYouDescription ||
                      "Let's bring your ideas to life — from first design to delivery, we make the process simple and reliable."}
                  </p>
                  <div className={styles.thankYouImage}></div>
                </div>
              ) : (
                <>
                  <div className={styles.main}>
                    <div className={styles.titleRow}>
                      <h1 className={styles.mainTitle}>
                        {t.quote?.mainTitle || "Talk or type"}
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

                        <motion.form
                          className={styles.form}
                          onSubmit={handleSubmit}
                          layout="position"
                          transition={{
                            layout: {
                              duration: 0.35,
                              ease: [0.4, 0, 0.2, 1],
                            },
                          }}
                        >
                          <div className={styles.formGroup}>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder={
                                t.quote?.namePlaceholder || "Full name*"
                              }
                              className={`${styles.input} ${
                                errors.name ? styles.inputError : ""
                              }`}
                            />
                            {errors.name && (
                              <span className={styles.errorMessage}>
                                {errors.name}
                              </span>
                            )}
                          </div>

                          <div className={styles.formGroup}>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="Email*"
                              className={`${styles.input} ${
                                styles.emailInput
                              } ${errors.email ? styles.inputError : ""}`}
                            />
                            {errors.email && (
                              <span className={styles.errorMessage}>
                                {errors.email}
                              </span>
                            )}
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
                                    handleMessengerSelect(messenger.id)
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
                            <AnimatePresence initial={false}>
                              {shouldShowMessengerInput(selectedMessenger) && (
                                <motion.div
                                  layout
                                  initial={{
                                    height: 0,
                                    opacity: 0,
                                    overflow: "hidden",
                                  }}
                                  animate={{
                                    height: "auto",
                                    opacity: 1,
                                  }}
                                  exit={{
                                    height: 0,
                                    opacity: 0,
                                    overflow: "hidden",
                                  }}
                                  transition={{
                                    height: {
                                      duration: 0.35,
                                      ease: [0.4, 0, 0.2, 1],
                                    },
                                    opacity: {
                                      duration: 0.35,
                                      ease: [0.4, 0, 0.2, 1],
                                    },
                                  }}
                                >
                                  <input
                                    type="text"
                                    name="messengerContact"
                                    value={formData.messengerContact}
                                    onChange={handleInputChange}
                                    placeholder={getMessengerPlaceholder(
                                      messengers.find(
                                        (m) => m.id === selectedMessenger
                                      )?.name || ""
                                    )}
                                    className={`${styles.input} ${
                                      styles.messengerInput
                                    } ${
                                      errors.messengerContact
                                        ? styles.inputError
                                        : ""
                                    }`}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {errors.messengerContact && (
                              <span className={styles.errorMessage}>
                                {errors.messengerContact}
                              </span>
                            )}
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              {t.quote?.yourRequest || "Your request"}
                            </label>
                            <div className={styles.toggleButtons}>
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
                            </div>
                          </div>

                          <AnimatePresence mode="popLayout" initial={false}>
                            {formData.requestType === "services" && (
                              <motion.div
                                className={styles.formGroup}
                                layout
                                initial={{
                                  height: 0,
                                  opacity: 0,
                                  overflow: "hidden",
                                }}
                                animate={{
                                  height: "auto",
                                  opacity: 1,
                                }}
                                exit={{
                                  height: 0,
                                  opacity: 0,
                                  overflow: "hidden",
                                }}
                                transition={{
                                  height: {
                                    duration: 0.35,
                                    ease: [0.4, 0, 0.2, 1],
                                  },
                                  opacity: {
                                    duration: 0.35,
                                    ease: [0.4, 0, 0.2, 1],
                                  },
                                }}
                              >
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
                                      onClick={() =>
                                        setSelectedService(service)
                                      }
                                    >
                                      {service.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <motion.div
                            className={styles.formGroup}
                            layout="position"
                          >
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
                          </motion.div>

                          <motion.div
                            className={styles.formGroup}
                            layout="position"
                          >
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
                          </motion.div>

                          <motion.div
                            className={styles.formGroup}
                            layout="position"
                          >
                            <Button
                              type="submit"
                              variant="solid"
                              padding="24px 48px"
                              arrow="white"
                              className={styles.submitButton}
                            >
                              {t.quote?.send || "Add to quote"}
                            </Button>
                          </motion.div>
                        </motion.form>
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
