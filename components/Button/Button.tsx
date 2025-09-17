"use client";

import React from "react";
import styles from "./Button.module.css";

type ButtonVariant = "transparent" | "solid";
type ButtonSize = "small" | "medium" | "large";
type ArrowType = "white" | "black" | "none";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: ArrowType;
  width?: string | number;
  height?: string | number;
  padding?: string | number;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const WhiteArrow = () => (
  <svg
    className={styles.arrow}
    width="24"
    height="17"
    viewBox="0 0 24 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.9562 1.61206L22.8442 8.50006M22.8442 8.50006L15.9562 15.3881M22.8442 8.50006H1.15625"
      stroke="white"
      strokeWidth="1.378"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BlackArrow = () => (
  <svg
    className={styles.arrow}
    width="24"
    height="17"
    viewBox="0 0 24 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.9562 1.61182L22.8442 8.49982M22.8442 8.49982L15.9562 15.3878M22.8442 8.49982H1.15625"
      stroke="#121212"
      strokeWidth="1.378"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Button({
  children,
  variant = "solid",
  size = "large",
  arrow = "none",
  width,
  height,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  padding,
}: ButtonProps) {
  const hasCustomSize = width || height;

  const buttonClasses = [
    styles.button,
    styles[variant],
    hasCustomSize ? styles.customSize : styles[size],
    arrow !== "none" ? styles.hasArrow : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const buttonStyle: React.CSSProperties = {};
  if (width)
    buttonStyle.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    buttonStyle.height = typeof height === "number" ? `${height}px` : height;
  if (padding)
    buttonStyle.padding =
      typeof padding === "number" ? `${padding}px` : padding;

  const renderArrow = () => {
    switch (arrow) {
      case "white":
        return <WhiteArrow />;
      case "black":
        return <BlackArrow />;
      default:
        return null;
    }
  };

  return (
    <button
      className={buttonClasses}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
      {renderArrow()}
    </button>
  );
}
