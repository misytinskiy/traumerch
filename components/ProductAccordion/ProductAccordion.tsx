"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import { getCatalogFieldValue, type CatalogFieldKey } from "../../shared/catalogFields";
import Accordion from "../Accordion/Accordion";

const ACCORDION_FIELDS: Record<"en" | "de", CatalogFieldKey[]> = {
  en: ["descriptionEn", "specificationsEn", "customisationEn", "productionEn"],
  de: ["descriptionDe", "specificationsDe", "customisationDe", "productionDe"],
};

interface ProductAccordionProps {
  productFields?: Record<string, unknown>;
}

export default function ProductAccordion({ productFields }: ProductAccordionProps) {
  const { t, language } = useLanguage();
  const fieldKeys = language === "de" ? ACCORDION_FIELDS.de : ACCORDION_FIELDS.en;

  const accordionItems = t.design.accordion.map((item, index) => {
    const fieldKey = fieldKeys[index];
    const airtableValue =
      productFields && fieldKey ? getCatalogFieldValue(productFields, fieldKey) : undefined;
    const content =
      airtableValue !== undefined && airtableValue !== null && airtableValue !== ""
        ? String(airtableValue)
        : (t.design?.noProductInfo ?? "No information about this product.");

    return {
      title: item.question,
      content,
    };
  });

  return <Accordion items={accordionItems} variant="compact" />;
}
