import React from "react";
import styles from "./SectionTitle.module.css";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: number | string;
  fontSize?: number | string;
}

export default function SectionTitle({
  children,
  className = "",
  maxWidth,
  fontSize = 50, // Default font size
}: SectionTitleProps) {
  const titleStyle: React.CSSProperties = {};
  if (maxWidth) {
    titleStyle.maxWidth =
      typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  }
  if (fontSize) {
    titleStyle.fontSize =
      typeof fontSize === "number" ? `${fontSize}px` : fontSize;
  }

  return (
    <h2 className={`${styles.title} ${className}`} style={titleStyle}>
      {children}
    </h2>
  );
}
