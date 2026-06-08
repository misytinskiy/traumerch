// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import en from "../locales/en.json";
import de from "../locales/de.json";
import ProductDetails from "../components/ProductDetails/ProductDetails";

const addItemMock = vi.fn();
let currentLanguage: "en" | "de" = "en";

vi.mock("../contexts/CartContext", () => ({
  useCart: () => ({ addItem: addItemMock }),
}));

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: currentLanguage === "de" ? de : en,
    language: currentLanguage,
  }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { alt, fill, priority, ...rest } = props;
    return <img alt={alt} {...rest} />;
  },
}));

describe("ProductDetails", () => {
  beforeEach(() => {
    addItemMock.mockReset();
    currentLanguage = "en";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("disables add button while loading", () => {
    render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={null}
      />
    );

    const button = screen.getByRole("button", { name: en.design.seePromise });
    expect(button).toBeDisabled();
  });

  it("enforces MOQ and adds item with at least min quantity", () => {
    const productRecord = {
      id: "rec1",
      fields: {
        "MOQ | SALES": "50",
        "1-24 pcs (Sample) | SALES": "€6",
      },
    };

    render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={productRecord}
      />
    );

    const input = screen.getByLabelText(en.design.quantity) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.blur(input);

    const button = screen.getByRole("button", { name: en.design.seePromise });
    fireEvent.click(button);

    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 50,
      })
    );
  });

  it("updates selected color and uses it when adding to cart", () => {
    const productRecord = {
      id: "rec1",
      fields: {
        "[WEB] Palette Hex Colours": "#ff0000, #00ff00",
      },
    };

    render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={productRecord}
      />
    );

    const colorButtons = screen.getAllByLabelText(/Color \d+/);
    fireEvent.click(colorButtons[1]);

    fireEvent.click(
      screen.getByRole("button", { name: en.design.seePromise })
    );

    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedColor: "#00ff00",
      })
    );
  });

  it("updates main image when photo fields change", () => {
    const firstRecord = {
      id: "rec1",
      fields: {
        "Main Product Photo": [{ url: "https://cdn.example.com/a.jpg" }],
      },
    };

    const secondRecord = {
      id: "rec1",
      fields: {
        "Main Product Photo": [{ url: "https://cdn.example.com/b.jpg" }],
      },
    };

    const { rerender } = render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={firstRecord}
      />
    );

    const firstImg = screen.getAllByAltText("Cap")[0] as HTMLImageElement;
    expect(firstImg.getAttribute("src")).toContain("https://cdn.example.com/a.jpg");

    rerender(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={secondRecord}
      />
    );

    const secondImg = screen.getAllByAltText("Cap")[0] as HTMLImageElement;
    expect(secondImg.getAttribute("src")).toContain("https://cdn.example.com/b.jpg");
  });

  it("uses palette photos for the selected color and switches main photo on color click", () => {
    const productRecord = {
      id: "rec1",
      fields: {
        "[WEB] Palette Hex Colours": "#111111, #00ff00",
        "[WEB] Palette Photos": [
          { url: "https://cdn.example.com/black.jpg" },
          { url: "https://cdn.example.com/green.jpg" },
        ],
        "Main Product Photo": [{ url: "https://cdn.example.com/default.jpg" }],
        "Secondary Product Photos": [{ url: "https://cdn.example.com/secondary.jpg" }],
      },
    };

    render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={productRecord}
      />
    );

    const defaultMainImg = screen.getAllByAltText("Cap")[0] as HTMLImageElement;
    expect(defaultMainImg.getAttribute("src")).toContain("https://cdn.example.com/black.jpg");

    const colorButtons = screen.getAllByLabelText(/Color \d+/);
    fireEvent.click(colorButtons[1]);

    const updatedMainImg = screen.getAllByAltText("Cap")[0] as HTMLImageElement;
    expect(updatedMainImg.getAttribute("src")).toContain("https://cdn.example.com/green.jpg");
  });

  it("falls back to main product photo when palette photos field is empty", () => {
    const productRecord = {
      id: "rec1",
      fields: {
        "[WEB] Palette Hex Colours": "#111111, #00ff00",
        "[WEB] Palette Photos": [],
        "Main Product Photo": [{ url: "https://cdn.example.com/default.jpg" }],
      },
    };

    render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={productRecord}
      />
    );

    const mainImg = screen.getAllByAltText("Cap")[0] as HTMLImageElement;
    expect(mainImg.getAttribute("src")).toContain("https://cdn.example.com/default.jpg");
  });

  it("renders special field text only when enabled and uses current language", () => {
    currentLanguage = "de";

    const productRecord = {
      id: "rec1",
      fields: {
        "[WEB] Product Special Field": true,
        "[WEB] Product Special Field Text EN": "Custom English note",
        "[WEB] Product Special Field Text DE": "Benutzerdefinierter Hinweis",
      },
    };

    render(
      <ProductDetails
        productId="rec1"
        productName="Cap"
        productRecord={productRecord}
      />
    );

    expect(screen.getByText(de.design.additionalDetails)).toBeInTheDocument();
    expect(screen.getByText("Benutzerdefinierter Hinweis")).toBeInTheDocument();
    expect(screen.queryByText("Custom English note")).not.toBeInTheDocument();
  });
});
