"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InlineWidget } from "react-calendly";
import { pushDataLayerEvent } from "../../shared/analytics";
import type { ConfTrackingContext } from "./confTracking";
import styles from "./ConfQuoteOverlay.module.css";

type Language = "en" | "de";

interface ConfQuoteOverlayProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  tracking: ConfTrackingContext;
}

interface ConfFormCopy {
  modalTitle: string;
  eyebrow: string;
  formTitleLine1: string;
  formTitleLine2: string;
  closeAria: string;
  labelName: string;
  placeholderName: string;
  labelEmail: string;
  placeholderEmail: string;
  labelMessenger: string;
  placeholderContact: string;
  labelRequest: string;
  labelDescription: string;
  placeholderDescription: string;
  fileUpload: string;
  fileRemove: string;
  fileMaxFiles: string;
  fileMaxSize: string;
  submitDefault: string;
  submitting: string;
  submitFailed: string;
  submitError: string;
  validationName: string;
  validationEmail: string;
  validationEmailInvalid: string;
  talkTitle: string;
  thankYouTitle: string;
  thankYouBody: string;
  thankYouClose: string;
  serviceOptions: { value: "services" | "merchandise"; label: string }[];
  messengerOptions: { value: string; label: string }[];
}

const COPY: Record<Language, ConfFormCopy> = {
  en: {
    modalTitle: "Talk or type — it's up to you",
    eyebrow: "We'll reply with options, pricing and production details.",
    formTitleLine1: "From messenger to quote —",
    formTitleLine2: "it's that simple",
    closeAria: "Close form",
    labelName: "Full name",
    placeholderName: "Full name*",
    labelEmail: "Email",
    placeholderEmail: "Email*",
    labelMessenger: "Preferred messenger",
    placeholderContact: "@handle or phone number",
    labelRequest: "Your request",
    labelDescription: "Description",
    placeholderDescription:
      "What you need, quantity, deadline, references…",
    fileUpload: "File upload",
    fileRemove: "Remove",
    fileMaxFiles: "You can attach up to X files.",
    fileMaxSize: "Total attachment size cannot exceed X MB.",
    submitDefault: "Request quote",
    submitting: "Sending…",
    submitFailed: "Something went wrong. Please try again.",
    submitError: "Network error. Please try again.",
    validationName: "Please enter your name.",
    validationEmail: "Please enter your email.",
    validationEmailInvalid: "Please enter a valid email.",
    talkTitle: "Let's talk it through",
    thankYouTitle: "Thank you",
    thankYouBody:
      "Let's bring your ideas to life — from first design to delivery, simple and reliable.",
    thankYouClose: "Close",
    serviceOptions: [
      { value: "services", label: "Services" },
      { value: "merchandise", label: "Merchandise" },
    ],
    messengerOptions: [
      { value: "WhatsApp", label: "WhatsApp" },
      { value: "Telegram", label: "Telegram" },
      { value: "Signal", label: "Signal" },
      { value: "Other", label: "Other" },
    ],
  },
  de: {
    modalTitle: "Sprechen oder tippen — Sie entscheiden",
    eyebrow:
      "Wir antworten mit Optionen, Preisen und Produktionsdetails.",
    formTitleLine1: "Vom Messenger zum Angebot —",
    formTitleLine2: "so einfach ist es.",
    closeAria: "Formular schließen",
    labelName: "Vollständiger Name",
    placeholderName: "Vollständiger Name*",
    labelEmail: "E-Mail",
    placeholderEmail: "E-Mail*",
    labelMessenger: "Bevorzugter Messenger",
    placeholderContact: "@Handle oder Telefonnummer",
    labelRequest: "Zusätzliche Anfrage",
    labelDescription: "Beschreibung",
    placeholderDescription:
      "Was Sie brauchen, Menge, Deadline, Referenzen…",
    fileUpload: "Datei hochladen",
    fileRemove: "Entfernen",
    fileMaxFiles: "Sie können bis zu X Dateien anhängen.",
    fileMaxSize: "Die Gesamtgröße darf X MB nicht überschreiten.",
    submitDefault: "Angebot anfordern",
    submitting: "Wird gesendet…",
    submitFailed: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
    submitError: "Netzwerkfehler. Bitte erneut versuchen.",
    validationName: "Bitte geben Sie Ihren Namen ein.",
    validationEmail: "Bitte geben Sie Ihre E-Mail ein.",
    validationEmailInvalid: "Bitte gültige E-Mail eingeben.",
    talkTitle: "Lassen Sie uns darüber sprechen",
    thankYouTitle: "Danke",
    thankYouBody:
      "Wir bringen Ihre Ideen zum Leben — vom ersten Entwurf bis zur Lieferung, einfach und zuverlässig.",
    thankYouClose: "Schließen",
    serviceOptions: [
      { value: "services", label: "Leistungen" },
      { value: "merchandise", label: "Merchandise" },
    ],
    messengerOptions: [
      { value: "WhatsApp", label: "WhatsApp" },
      { value: "Telegram", label: "Telegram" },
      { value: "Signal", label: "Signal" },
      { value: "Other", label: "Andere" },
    ],
  },
};

const CALENDLY_URL = "https://calendly.com/traumerch/30min";
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  messengerContact: string;
  description: string;
}

const initialFormState: FormState = {
  name: "",
  email: "",
  messengerContact: "",
  description: "",
};

export default function ConfQuoteOverlay({
  open,
  onClose,
  language,
  tracking,
}: ConfQuoteOverlayProps) {
  const copy = COPY[language];
  const [form, setForm] = useState<FormState>(initialFormState);
  const [selectedMessenger, setSelectedMessenger] = useState<string>("");
  const [requestType, setRequestType] = useState<"services" | "merchandise">(
    "merchandise"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const resetState = useCallback(() => {
    setForm(initialFormState);
    setSelectedMessenger("");
    setRequestType("merchandise");
    setFiles([]);
    setFileError("");
    setErrors({});
    setShowThankYou(false);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pushDataLayerEvent("conf_quote_open", {
      scan_id: tracking.scanId || "",
      visitor_id: tracking.visitorId || "",
    });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, tracking.scanId, tracking.visitorId]);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
    titleRef.current?.focus();
  }, [open, resetState]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) =>
      prev[name as keyof FormState]
        ? { ...prev, [name as keyof FormState]: undefined }
        : prev
    );
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const next = [...files, ...incoming];
    if (next.length > MAX_FILES) {
      setFileError(copy.fileMaxFiles.replace("X", String(MAX_FILES)));
      e.target.value = "";
      return;
    }
    const total = next.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setFileError(copy.fileMaxSize.replace("X", "15"));
      e.target.value = "";
      return;
    }
    setFiles(next);
    setFileError("");
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = copy.validationName;
    if (!form.email.trim()) {
      next.email = copy.validationEmail;
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = copy.validationEmailInvalid;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) {
      pushDataLayerEvent("conf_form_validation_error", {
        form_context: "conf_overlay",
      });
      return;
    }
    setIsSubmitting(true);
    pushDataLayerEvent("conf_form_submit_attempt", {
      form_context: "conf_overlay",
      has_files: files.length > 0,
      messenger: selectedMessenger || "unspecified",
      request_type: requestType,
    });

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim());
      if (form.description.trim()) {
        formData.append("description", form.description.trim());
      }
      if (selectedMessenger) {
        formData.append("preferredMessenger", selectedMessenger);
        if (form.messengerContact.trim()) {
          formData.append("messengerContact", form.messengerContact.trim());
        }
      }
      formData.append(
        "requestType",
        requestType === "services" ? "Services" : "Merchandise"
      );

      // /conf source override — server validates these as a whitelisted pair
      // before applying any non-default Lead Source value.
      formData.append("sourceKey", "conf_qr");
      formData.append("campaign", "ggate26");
      formData.append("landingPage", "/conf");
      if (tracking.scanId) formData.append("scanId", tracking.scanId);
      if (tracking.visitorId) formData.append("visitorId", tracking.visitorId);

      files.forEach((file) => formData.append("attachments", file));

      const response = await fetch("/api/airtable-quote", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        pushDataLayerEvent("conf_form_submit_success", {
          form_context: "conf_overlay",
        });
        setShowThankYou(true);
      } else {
        pushDataLayerEvent("conf_form_submit_error", {
          form_context: "conf_overlay",
          status_code: response.status,
        });
        console.error("[conf] lead submit failed", response.status, payload);
        window.alert(copy.submitFailed);
      }
    } catch (error) {
      pushDataLayerEvent("conf_form_submit_error", {
        form_context: "conf_overlay",
        status_code: "network",
      });
      console.error("[conf] lead submit network error", error);
      window.alert(copy.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="conf-quote-title"
      onClick={onClose}
    >
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={copy.closeAria}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {showThankYou ? (
          <div className={styles.thankYou}>
            <h2 className={`${styles.eb} ${styles.thankYouTitle}`}>
              {copy.thankYouTitle}
            </h2>
            <p className={styles.thankYouBody}>{copy.thankYouBody}</p>
            <button
              type="button"
              className={styles.outlineButton}
              onClick={onClose}
            >
              {copy.thankYouClose}
            </button>
          </div>
        ) : (
          <>
            <h2
              id="conf-quote-title"
              ref={titleRef}
              tabIndex={-1}
              className={`${styles.eb} ${styles.modalTitle}`}
            >
              {copy.modalTitle}
            </h2>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowAccent}>GGATE26</span>{" "}
              <span aria-hidden>·</span> {copy.eyebrow}
            </p>

            <div className={styles.grid}>
              <div className={styles.formColumn}>
                <h3 className={`${styles.eb} ${styles.formTitle}`}>
                  {copy.formTitleLine1}
                  <br />
                  {copy.formTitleLine2}
                </h3>
                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="conf-name">
                      {copy.labelName}
                    </label>
                    <input
                      id="conf-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder={copy.placeholderName}
                      value={form.name}
                      onChange={handleFieldChange}
                      className={`${styles.input} ${
                        errors.name ? styles.inputError : ""
                      }`}
                      aria-invalid={errors.name ? "true" : "false"}
                    />
                    {errors.name ? (
                      <span className={styles.errorText}>{errors.name}</span>
                    ) : null}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="conf-email">
                      {copy.labelEmail}
                    </label>
                    <input
                      id="conf-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={copy.placeholderEmail}
                      value={form.email}
                      onChange={handleFieldChange}
                      className={`${styles.input} ${
                        errors.email ? styles.inputError : ""
                      }`}
                      aria-invalid={errors.email ? "true" : "false"}
                    />
                    {errors.email ? (
                      <span className={styles.errorText}>{errors.email}</span>
                    ) : null}
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>{copy.labelMessenger}</span>
                    <div className={styles.chipRow}>
                      {copy.messengerOptions.map((option) => {
                        const isActive = selectedMessenger === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.chip} ${
                              isActive ? styles.chipActive : ""
                            }`}
                            onClick={() =>
                              setSelectedMessenger(isActive ? "" : option.value)
                            }
                            aria-pressed={isActive}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      name="messengerContact"
                      type="text"
                      placeholder={copy.placeholderContact}
                      value={form.messengerContact}
                      onChange={handleFieldChange}
                      className={`${styles.input} ${styles.contactInput}`}
                      autoComplete="off"
                    />
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>{copy.labelRequest}</span>
                    <div className={styles.toggleRow}>
                      {copy.serviceOptions.map((option) => {
                        const isActive = requestType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.toggle} ${
                              isActive ? styles.toggleActive : ""
                            }`}
                            onClick={() => setRequestType(option.value)}
                            aria-pressed={isActive}
                          >
                            {option.label.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="conf-description">
                      {copy.labelDescription}
                    </label>
                    <textarea
                      id="conf-description"
                      name="description"
                      placeholder={copy.placeholderDescription}
                      value={form.description}
                      onChange={handleFieldChange}
                      className={styles.textarea}
                      rows={5}
                    />
                  </div>

                  <div className={styles.fileBlock}>
                    <label
                      htmlFor="conf-file"
                      className={styles.fileTrigger}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M12 15V3M12 3L8 7M12 3L16 7M4 13V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V13"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{copy.fileUpload}</span>
                    </label>
                    <input
                      id="conf-file"
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFiles}
                      className={styles.fileInput}
                    />
                    {fileError ? (
                      <p className={styles.errorText}>{fileError}</p>
                    ) : null}
                    {files.length > 0 ? (
                      <ul className={styles.fileList}>
                        {files.map((file, index) => (
                          <li key={`${file.name}-${index}`} className={styles.fileItem}>
                            <span className={styles.fileName}>{file.name}</span>
                            <button
                              type="button"
                              className={styles.fileRemove}
                              onClick={() => removeFile(index)}
                            >
                              {copy.fileRemove}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? copy.submitting : copy.submitDefault}
                    <span aria-hidden className={styles.submitArrow}>→</span>
                  </button>
                </form>
              </div>

              <div className={styles.calendlyColumn}>
                <h3 className={`${styles.eb} ${styles.calendlyTitle}`}>
                  {copy.talkTitle}
                </h3>
                <div className={styles.calendlyWrap}>
                  <InlineWidget
                    url={CALENDLY_URL}
                    // Fixed height so the Calendly meeting picker fits without
                    // an internal iframe scrollbar. Width is fluid via the
                    // surrounding flex column.
                    styles={{ minWidth: "320px", height: "720px" }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
