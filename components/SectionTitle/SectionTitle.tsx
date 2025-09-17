import React from "react";
import styles from "./SectionTitle.module.css";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: number | string;
}

export default function SectionTitle({
  children,
  className = "",
  maxWidth,
}: SectionTitleProps) {
  const titleStyle: React.CSSProperties = {};
  if (maxWidth) {
    titleStyle.maxWidth =
      typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  }

  return (
    <h2 className={`${styles.title} ${className}`} style={titleStyle}>
      {children}
    </h2>
  );
}
