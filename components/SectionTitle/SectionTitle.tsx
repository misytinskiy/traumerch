import React from "react";
import styles from "./SectionTitle.module.css";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionTitle({
  children,
  className = "",
}: SectionTitleProps) {
  return <h2 className={`${styles.title} ${className}`}>{children}</h2>;
}
