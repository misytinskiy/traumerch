// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import en from "../locales/en.json";
import ProductInfo from "../components/ProductInfo/ProductInfo";

const useLanguageMock = vi.fn();

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => useLanguageMock(),
}));

describe("ProductInfo", () => {
  beforeEach(() => {
    useLanguageMock.mockReset();
  });

  it("changes slider image when navigating", () => {
    useLanguageMock.mockReturnValue({ t: en, language: "en" });

    const { container } = render(<ProductInfo />);
    const image = container.querySelector(
      'div[style*="background-image"]'
    ) as HTMLElement;

    expect(image).toBeTruthy();
    expect(image.style.backgroundImage).toContain("/inspiration/1.png");

    fireEvent.click(screen.getByLabelText("Next image"));

    expect(image.style.backgroundImage).toContain("/inspiration/2.png");
  });
});
