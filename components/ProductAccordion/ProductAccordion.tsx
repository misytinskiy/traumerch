"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import Accordion from "../Accordion/Accordion";

/** Base field names (same order as design.accordion). EN/DE suffix added from language. */
const ACCORDION_FIELD_BASES = [
  "[WEB] Description",
  "[WEB] Specifications",
  "[WEB] Customisation",
  "[WEB] Production",
];

interface ProductAccordionProps {
  productFields?: Record<string, unknown>;
}

export default function ProductAccordion({ productFields }: ProductAccordionProps) {
  const { t, language } = useLanguage();
  const suffix = language === "de" ? " DE" : " EN";

  const accordionItems = t.design.accordion.map((item, index) => {
    const fieldName = ACCORDION_FIELD_BASES[index] + suffix;
    const airtableValue = productFields && fieldName ? productFields[fieldName] : undefined;
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
