"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import Accordion from "../Accordion/Accordion";

const TM_IN_TEXT_TITLES = new Set([
  "IMPRINT",
  "REFUNDS POLICY",
  "IMPRESSUM",
  "RÜCKERSTATTUNGSRICHTLINIE",
]);

export default function PolicyAccordion() {
  const { t } = useLanguage();

  const policyItems = t.policies.items.map((item) => ({
    title: item.title,
    content: TM_IN_TEXT_TITLES.has(item.title)
      ? item.content.replaceAll("™", "[[TM_BADGE]]")
      : item.content,
  }));

  return <Accordion items={policyItems} variant="default" />;
}
