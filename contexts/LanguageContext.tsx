"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import enTranslations from "../locales/en.json";
import deTranslations from "../locales/de.json";

export type Language = "en" | "de";
export type Country = "DE" | "AT" | "EN";
type Translations = typeof enTranslations;

interface LanguageContextType {
  language: Language;
  country: Country;
  setLanguage: (lang: Language) => void;
  setCountry: (country: Country) => void;
  t: Translations;
}

const translations = {
  en: enTranslations,
  de: deTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Function to detect country by IP
const detectCountry = async (): Promise<Country> => {
  try {
    // Using ipapi.co for geolocation (free service)
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
    });

    if (!response.ok) {
      return "EN";
    }

    const data = await response.json();
    const countryCode = (data?.country_code || "").toUpperCase();

    if (countryCode === "DE") return "DE";
    if (countryCode === "AT") return "AT";
    return "EN"; // Default for all other countries
  } catch {
    return "EN"; // Fallback to English
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [country, setCountry] = useState<Country>("EN");

  useEffect(() => {
    let isMounted = true;

    const initializeLocation = async () => {
      const savedLanguage = localStorage.getItem("language") as Language | null;
      const savedCountry = localStorage.getItem("country") as Country | null;

      if (savedLanguage) {
        setLanguage(savedLanguage);
      }

      if (savedCountry) {
        setCountry(savedCountry);
      }

      const detectedCountry = await detectCountry();
      if (!isMounted) return;

      setCountry(detectedCountry);
      localStorage.setItem("country", detectedCountry);

      if (!savedLanguage) {
        const newLanguage: Language =
          detectedCountry === "DE" || detectedCountry === "AT" ? "de" : "en";
        setLanguage(newLanguage);
        localStorage.setItem("language", newLanguage);
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleSetCountry = (newCountry: Country) => {
    setCountry(newCountry);
    localStorage.setItem("country", newCountry);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        country,
        setLanguage: handleSetLanguage,
        setCountry: handleSetCountry,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
