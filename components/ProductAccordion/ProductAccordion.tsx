"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import Accordion from "../Accordion/Accordion";

export default function ProductAccordion() {
  const { t } = useLanguage();

  // Transform design accordion data to accordion format
  const accordionItems = t.design.accordion.map((item) => ({
    title: item.question,
    content: item.answer,
  }));

  return <Accordion items={accordionItems} variant="compact" />;
}
