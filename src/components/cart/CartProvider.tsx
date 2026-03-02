"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  imageUrl: string | null;
  price: number;
  variantName: string | null;
  quantity: number;
  maxQuantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = "pabakal-cart";

function loadCart(): CartItem[] {
  if (typeof globalThis === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: CartItem[] = JSON.parse(raw);
    return parsed;
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId,
      );
      if (idx !== -1) {
        const updated = [...prev];
        const existing = updated[idx];
        updated[idx] = {
          ...existing,
          quantity: Math.min(existing.quantity + (newItem.quantity ?? 1), existing.maxQuantity),
        };
        return updated;
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId)),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (i.productId === productId && i.variantId === variantId) {
              return { ...i, quantity: Math.max(0, Math.min(quantity, i.maxQuantity)) };
            }
            return i;
          })
          .filter((i) => i.quantity > 0),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }),
    [items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
