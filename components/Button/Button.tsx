"use client";

import React, { useState, useEffect } from "react";
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
  padding768?: string | number;
  padding480?: string | number;
  padding350?: string | number;
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
      stroke="currentColor"
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
      stroke="currentColor"
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
  padding768,
  padding480,
  padding350,
}: ButtonProps) {
  const [currentPadding, setCurrentPadding] = useState<
    string | number | undefined
  >(padding);
  const hasCustomSize = width || height;

  useEffect(() => {
    const updatePadding = () => {
      if (window.innerWidth <= 350 && padding350) {
        setCurrentPadding(padding350);
      } else if (window.innerWidth <= 480 && padding480) {
        setCurrentPadding(padding480);
      } else if (window.innerWidth <= 768 && padding768) {
        setCurrentPadding(padding768);
      } else {
        setCurrentPadding(padding);
      }
    };

    updatePadding();
    window.addEventListener("resize", updatePadding);
    return () => window.removeEventListener("resize", updatePadding);
  }, [padding, padding768, padding480, padding350]);

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
  if (currentPadding)
    buttonStyle.padding =
      typeof currentPadding === "number"
        ? `${currentPadding}px`
        : currentPadding;

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
      <span className={styles.buttonText}>{children}</span>
      {renderArrow()}
    </button>
  );
}
