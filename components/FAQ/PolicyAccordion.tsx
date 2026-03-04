"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import Accordion from "../Accordion/Accordion";

export default function PolicyAccordion() {
  const { t } = useLanguage();

  const policyItems = t.policies.items.map((item) => ({
    title: item.title,
    content: item.content,
  }));

  return <Accordion items={policyItems} variant="default" />;
}
