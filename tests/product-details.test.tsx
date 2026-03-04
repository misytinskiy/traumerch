// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import en from "../locales/en.json";
import ProductDetails from "../components/ProductDetails/ProductDetails";

const addItemMock = vi.fn();

vi.mock("../contexts/CartContext", () => ({
  useCart: () => ({ addItem: addItemMock }),
}));

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: en, language: "en" }),
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
});
