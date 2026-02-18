"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineWidget } from "react-calendly";
import Image from "next/image";
import Button from "../Button/Button";
import ThankYouOverlay from "../ThankYouOverlay/ThankYouOverlay";
import { useQuoteOverlay } from "../../contexts/QuoteOverlayContext";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./QuoteOverlay.module.css";

interface QuoteFormData {
  name: string;
  email: string;
  preferredMessenger: string;
  messengerContact: string;
  requestType: "services" | "merchandise";
  service: string[];
  description: string;
  files: File[];
}

const messengers = [
  { id: 1, name: "WhatsApp", icon: "/quoteIcons/whatsapp.svg" },
  { id: 2, name: "Email", icon: "/quoteIcons/email.svg" },
  { id: 3, name: "Slack", icon: "/quoteIcons/slack.svg" },
  { id: 4, name: "Teams", icon: "/quoteIcons/teams.svg" },
];

const defaultServiceOptions = [
  { value: "Private Label", label: "Private label" },
  { value: "Influencer Activation", label: "Influencer activation" },
  { value: "Smart Platform", label: "Smart platform" },
];

export default function QuoteOverlay() {
  const { isOpen, closeQuote } = useQuoteOverlay();
  const { t } = useLanguage();
  const serviceOptions =
    (t.quote?.requestOptions as { value: string; label: string }[]) ??
    defaultServiceOptions;
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    email: "",
    preferredMessenger: "Email",
    messengerContact: "",
    requestType: "services",
    service: [],
    description: "",
    files: [],
  });
  const [selectedMessenger, setSelectedMessenger] = useState<number | null>(
    2
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        preferredMessenger: "Email",
        messengerContact: "",
        requestType: "services",
        service: [],
        description: "",
        files: [],
      });
      setSelectedMessenger(2);
      setSelectedServices([]);
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
      newErrors.name = t.quote.errors.nameRequired;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.quote.errors.emailRequired;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t.quote.errors.emailInvalid;
    }

    if (selectedMessenger) {
      const messenger = messengers.find((m) => m.id === selectedMessenger);
      if (
        messenger &&
        messenger.name !== "Email" &&
        messenger.name !== "Teams"
      ) {
        if (!formData.messengerContact.trim()) {
          newErrors.messengerContact = t.quote.errors.messengerContactRequired;
        } else if (
          messenger.name === "WhatsApp" &&
          !validatePhone(formData.messengerContact)
        ) {
          newErrors.messengerContact = t.quote.errors.phoneInvalid;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [fileError, setFileError] = useState<string>("");
  const MAX_FILES = 5;
  const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

  const getTotalSize = (files: File[]) =>
    files.reduce((sum, file) => sum + file.size, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const next = [...formData.files, ...incoming];

    if (next.length > MAX_FILES) {
      setFileError(t.quote.fileErrors.maxFiles.replace("X", String(MAX_FILES)));
      e.currentTarget.value = "";
      return;
    }

    if (getTotalSize(next) > MAX_TOTAL_BYTES) {
      setFileError(
        t.quote.fileErrors.maxTotalSize.replace("X", String(15))
      );
      e.currentTarget.value = "";
      return;
    }

    setFormData((prev) => ({ ...prev, files: next }));
    setFileError("");
    e.currentTarget.value = "";
  };

  const handleRemoveFile = (fileIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== fileIndex),
    }));
    setFileError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Get selected messenger name
        const selectedMessengerName =
          messengers.find((m) => m.id === selectedMessenger)?.name || "";

        // Prepare data for Airtable
        const submitData: Record<string, unknown> = {
          name: formData.name,
          email: formData.email,
          preferredMessenger:
            selectedMessengerName || formData.preferredMessenger,
          messengerContact: formData.messengerContact,
          requestType: formData.requestType,
          service: selectedServices,
          description: formData.description,
        };

        const submitForm = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          if (Array.isArray(value)) {
            submitForm.append(key, JSON.stringify(value));
          } else {
            submitForm.append(key, String(value));
          }
        });
        formData.files.forEach((file) => {
          submitForm.append("attachments", file);
        });

        // Submit data to Airtable
        const submitResponse = await fetch("/api/airtable-quote", {
          method: "POST",
          body: submitForm,
        });

        const responsePayload = await submitResponse.json();

        if (submitResponse.ok) {
          setShowThankYou(true);
        } else {
          console.error("QuoteOverlay submit error", {
            status: submitResponse.status,
            payload: responsePayload,
          });
          alert(t.quote.submitFailed);
        }
      } catch {
        alert(t.quote.submitError);
      } finally {
        setIsSubmitting(false);
      }
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
        return t.quote.messengerPlaceholders.whatsapp;
      case "Slack":
        return t.quote.messengerPlaceholders.slack;
      case "Teams":
        return t.quote.messengerPlaceholders.teams;
      default:
        return t.quote.messengerPlaceholders.default;
    }
  };

  const shouldShowMessengerInput = (messengerId: number | null): boolean => {
    if (!messengerId) return false;
    const messenger = messengers.find((m) => m.id === messengerId);
    return messenger?.name !== "Email" && messenger?.name !== "Teams";
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        showThankYou ? (
          <ThankYouOverlay
            title={t.quote.thankYouTitle}
            description={
              t.quote.thankYouDescription
            }
            onClose={closeQuote}
          />
        ) : (
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
              <div className={styles.main}>
                <div className={styles.titleRow}>
                  <h1 className={styles.mainTitle}>
                    {t.quote.mainTitleShort}
                  </h1>
                  <button
                    className={styles.closeButton}
                    onClick={closeQuote}
                    aria-label={t.quote.closeAria}
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
                      {t.quote.formTitle}
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
                          placeholder={t.quote.namePlaceholder}
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
                              placeholder={t.quote.emailPlaceholder}
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
                              {t.quote.preferredMessenger}
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
                              {t.quote.yourRequest}
                            </label>
                            <div className={styles.toggleButtons}>
                              {serviceOptions.map((service) => (
                                <button
                                  key={service.value}
                                  type="button"
                                  className={`${styles.toggleButton} ${
                                    selectedServices.includes(service.value)
                                      ? styles.toggleButtonActive
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedServices((prev) =>
                                      prev.includes(service.value)
                                        ? prev.filter((item) => item !== service.value)
                                        : [...prev, service.value]
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      requestType: "services",
                                      service: prev.service.includes(service.value)
                                        ? prev.service.filter((item) => item !== service.value)
                                        : [...prev.service, service.value],
                                    }));
                                  }}
                                >
                                  {service.label.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <motion.div
                            className={styles.formGroup}
                            layout="position"
                          >
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              placeholder={
                                t.quote.description
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
                                {t.quote.fileUpload}
                              </span>
                            </label>
                            <input
                              id="file-upload"
                              type="file"
                              onChange={handleFileChange}
                              className={styles.fileInput}
                              accept="image/*,.pdf,.doc,.docx"
                              multiple
                            />
                          </motion.div>
                          {fileError && (
                            <div className={styles.fileError}>{fileError}</div>
                          )}
                          {formData.files.length > 0 && (
                            <ul className={styles.fileList}>
                              {formData.files.map((file, index) => (
                                <li
                                  key={`${file.name}-${index}`}
                                  className={styles.fileItem}
                                >
                                  <span className={styles.fileName}>
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    className={styles.fileRemove}
                                    onClick={() => handleRemoveFile(index)}
                                  >
                                    {t.quote.fileRemove}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}

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
                          disabled={isSubmitting}
                        >
                          <span className={styles.submitContent}>
                            {isSubmitting && (
                              <span
                                className={styles.spinner}
                                aria-hidden
                              />
                            )}
                            <span>
                              {isSubmitting
                                ? t.quote.submitting
                                : t.quote.send}
                            </span>
                          </span>
                        </Button>
                      </motion.div>
                    </motion.form>
                  </div>

                  <div className={styles.rightColumn}>
                    <h2 className={styles.rightTitle}>
                      {t.quote.rightTitle}
                    </h2>
                    <div className={styles.calendlyWidget}>
                      <InlineWidget url="https://calendly.com/traumerch/30min" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )
      ) : null}
    </AnimatePresence>
  );
}
