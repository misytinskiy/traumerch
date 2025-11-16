"use client";

import { useState } from "react";
import Button from "../Button/Button";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "../../app/quote/quote.module.css";

interface QuoteFormData {
  name: string;
  preferredMessenger: string;
  requestType: "services" | "merchandise";
  service: string;
  description: string;
  file: File | null;
}

interface QuoteFormProps {
  onSubmit?: (data: QuoteFormData) => void;
}

const messengers = [
  { id: 1, name: "WhatsApp" },
  { id: 2, name: "Telegram" },
  { id: 3, name: "Signal" },
  { id: 4, name: "Other" },
];

const servicesList = ["Service 1", "Service 2", "Service 3", "Service 4"];

export default function QuoteForm({ onSubmit }: QuoteFormProps) {
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
    onSubmit?.(formData);
  };

  if (showThankYou) {
    return (
      <main className={styles.main}>
        <div className={styles.thankYouContent}>
          <h1 className={styles.thankYouTitle}>
            {t.quote?.thankYouTitle || "Thank you"}
          </h1>
          <p className={styles.thankYouDescription}>
            {t.quote?.thankYouDescription ||
              "Let's bring your ideas to life — from first design to delivery, we make the process simple and reliable."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.mainTitle}>
        {t.quote?.mainTitle || "Talk or type"} <br />—{" "}
        {t.quote?.mainTitleEnd || "it's up to you"}
      </h1>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <h2 className={styles.formTitle}>
            {t.quote?.formTitle ||
              "From Messenger to Quote — it's that simple."}
          </h2>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t.quote?.preferredMessenger || "Preferred Messenger"}
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
                {t.quote?.preferredMessenger || "Preferred Messenger"}
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
                    onClick={() => setSelectedMessenger(messenger.id)}
                  />
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
                  {(t.quote?.services || "Services").toUpperCase()}
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
                placeholder={t.quote?.description || "Description"}
                className={styles.textarea}
                rows={6}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="file-upload" className={styles.fileUploadLabel}>
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
              padding="20px 48px"
              arrow="white"
              className={styles.submitButton}
            >
              {t.quote?.send || "SEND"}
            </Button>
          </form>
        </div>

        <div className={styles.rightColumn}>
          <h2 className={styles.rightTitle}>
            {t.quote?.rightTitle || "Let's talk it through"}
          </h2>
        </div>
      </div>
    </main>
  );
}
