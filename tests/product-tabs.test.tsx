// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import en from "../locales/en.json";
import de from "../locales/de.json";
import ProductTabs from "../components/ProductTabs/ProductTabs";

const useLanguageMock = vi.fn();
const useSWRMock = vi.fn();

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => useLanguageMock(),
}));

vi.mock("swr", () => ({
  default: (key: string) => useSWRMock(key),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { alt, ...rest } = props;
    return <img alt={alt} {...rest} />;
  },
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("ProductTabs", () => {
  beforeEach(() => {
    useSWRMock.mockReset();
    useLanguageMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows empty state when no products are returned", () => {
    useLanguageMock.mockReturnValue({ t: en, language: "en" });
    useSWRMock.mockReturnValue({
      data: { records: [] },
      error: undefined,
      isLoading: false,
    });

    render(<ProductTabs initialRecords={[]} />);

    expect(
      screen.getByText("No products in this category yet.")
    ).toBeInTheDocument();
  });

  it("localizes price text for German", () => {
    useLanguageMock.mockReturnValue({ t: de, language: "de" });
    useSWRMock.mockReturnValue({
      data: {
        records: [
          {
            id: "rec1",
            nameEn: "Cap",
            nameDe: "Kappe",
            price: "From €6",
            imageUrl: null,
            imageUrlSmall: null,
            imageUrlLarge: null,
            imageUrlFull: null,
            outOfStock: false,
            categories: [],
          },
        ],
      },
      error: undefined,
      isLoading: false,
    });

    render(<ProductTabs initialRecords={[]} />);

    expect(screen.getByText("Ab €6")).toBeInTheDocument();
  });

  it("switches tab and renders category products", () => {
    useLanguageMock.mockReturnValue({ t: en, language: "en" });
    useSWRMock.mockImplementation((key: string) => {
      if (key.includes("category=bags")) {
        return {
          data: {
            records: [
              {
                id: "bag1",
                nameEn: "Bag",
                nameDe: "Tasche",
                price: "From €8",
                imageUrl: null,
                imageUrlSmall: null,
                imageUrlLarge: null,
                imageUrlFull: null,
                outOfStock: false,
                categories: [],
              },
            ],
          },
          error: undefined,
          isLoading: false,
        };
      }

      return {
        data: {
          records: [
            {
              id: "all1",
              nameEn: "All Product",
              nameDe: "Alle",
              price: "From €5",
              imageUrl: null,
              imageUrlSmall: null,
              imageUrlLarge: null,
              imageUrlFull: null,
              outOfStock: false,
              categories: [],
            },
          ],
        },
        error: undefined,
        isLoading: false,
      };
    });

    render(<ProductTabs initialRecords={[]} />);

    expect(screen.getByText("All Product")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Bags"));

    expect(screen.getByText("Bag")).toBeInTheDocument();
  });
});
