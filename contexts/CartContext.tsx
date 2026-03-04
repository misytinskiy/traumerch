"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  selectedColor: string;
  description?: string;
  files?: File[];

  productFields?: Record<string, unknown>;
}

const STORAGE_KEY = "traumerch:cart";

const serializeItems = (items: CartItem[]) =>
  items.map(({ files, ...rest }) => rest);

const normalizeCartItems = (raw: unknown): CartItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<CartItem[]>((acc, entry) => {
    if (!entry || typeof entry !== "object") return acc;
    const item = entry as Partial<CartItem>;
    if (
      typeof item.productId !== "string" ||
      typeof item.productName !== "string" ||
      typeof item.selectedColor !== "string"
    ) {
      return acc;
    }
    const qty =
      typeof item.quantity === "number"
        ? item.quantity
        : parseInt(String(item.quantity ?? ""), 10);
    const quantity = Number.isNaN(qty) ? 1 : Math.max(1, qty);
    acc.push({
      productId: item.productId,
      productName: item.productName,
      selectedColor: item.selectedColor,
      quantity,
      description: typeof item.description === "string" ? item.description : undefined,
      productFields:
        item.productFields && typeof item.productFields === "object"
          ? (item.productFields as Record<string, unknown>)
          : undefined,
    });
    return acc;
  }, []);
};

interface CartContextValue {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  updateItemDescription: (index: number, description: string) => void;
  updateItemFiles: (index: number, files: File[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeCartItems(parsed);
      if (normalized.length > 0) {
        setItems(normalized);
      }
    } catch {
      // Ignore invalid storage
    }
  }, []);

  useEffect(() => {
    const next = JSON.stringify(serializeItems(items));
    localStorage.setItem(STORAGE_KEY, next);
  }, [items]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const updateItemDescription = useCallback(
    (index: number, description: string) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, description } : item
        )
      );
    },
    []
  );

  const updateItemFiles = useCallback((index: number, files: File[]) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, files } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateItemQuantity,
        updateItemDescription,
        updateItemFiles,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
