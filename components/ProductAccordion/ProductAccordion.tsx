"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import Accordion from "../Accordion/Accordion";

/** Airtable column names for accordion content (same order as design.accordion). */
const AIRTABLE_ACCORDION_FIELDS = [
  "[WEB] Description",
  "[WEB] Specifications",
  "[WEB] Customisation",
  "[WEB] Production",
];

interface ProductAccordionProps {
  productFields?: Record<string, unknown>;
}

export default function ProductAccordion({ productFields }: ProductAccordionProps) {
  const { t } = useLanguage();

  const accordionItems = t.design.accordion.map((item, index) => {
    const fieldName = AIRTABLE_ACCORDION_FIELDS[index];
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
