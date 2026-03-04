// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import en from "../locales/en.json";
import QuoteContactPage from "../features/quote/contact/ContactPage";
import type { CartItem } from "../contexts/CartContext";

const clearCartMock = vi.fn();
const updateItemQuantityMock = vi.fn();
const pushMock = vi.fn();

const cartItem: CartItem = {
  productId: "p1",
  productName: "Cap",
  quantity: 10,
  selectedColor: "Black",
  productFields: {
    "[WEB] Name ENG": "Cap",
    "1-24 pcs (Sample) | SALES": "€10",
    "# MOQ | SALES": 1,
  },
};

vi.mock("../contexts/CartContext", () => ({
  useCart: () => ({
    items: [cartItem],
    updateItemQuantity: updateItemQuantityMock,
    clearCart: clearCartMock,
  }),
}));

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: en, language: "en" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Quote contact submit", () => {
  beforeEach(() => {
    clearCartMock.mockReset();
    updateItemQuantityMock.mockReset();
    pushMock.mockReset();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
  });

  it("submits the contact form and shows thank you", async () => {
    render(<QuoteContactPage />);

    fireEvent.change(screen.getByPlaceholderText(en.quoteContact.firstNamePlaceholder), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText(en.quoteContact.lastNamePlaceholder), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(en.quoteContact.emailPlaceholder), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(en.quoteContact.phonePlaceholder), {
      target: { value: "+123456789" },
    });

    fireEvent.click(screen.getByText(en.quoteContact.submitLabel));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/airtable-quote",
        expect.objectContaining({ method: "POST" })
      );
    });

    await waitFor(() => {
      expect(clearCartMock).toHaveBeenCalled();
    });

    expect(screen.getByText(en.quote.thankYouTitle)).toBeInTheDocument();
  });
});
