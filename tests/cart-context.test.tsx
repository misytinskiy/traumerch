// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CartProvider, useCart, type CartItem } from "../contexts/CartContext";

const STORAGE_KEY = "traumerch:cart";

const sampleItem: CartItem = {
  productId: "p1",
  productName: "Cap",
  quantity: 2,
  selectedColor: "Black",
};

function CartHarness() {
  const {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
  } = useCart();
  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <div data-testid="qty">{items[0]?.quantity ?? 0}</div>
      <button type="button" onClick={() => addItem(sampleItem)}>
        add
      </button>
      <button type="button" onClick={() => updateItemQuantity(0, 5)}>
        update
      </button>
      <button type="button" onClick={() => removeItem(0)}>
        remove
      </button>
    </div>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads cart from localStorage on mount", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleItem]));

    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("qty")).toHaveTextContent("2");
  });

  it("persists add/update/remove to localStorage", async () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>
    );

    fireEvent.click(screen.getByText("add"));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].quantity).toBe(2);
    });

    fireEvent.click(screen.getByText("update"));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored[0].quantity).toBe(5);
    });

    fireEvent.click(screen.getByText("remove"));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored).toHaveLength(0);
    });
  });
});
