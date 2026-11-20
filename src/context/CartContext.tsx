"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  modelName: string;
  price: number;
  quantity: number;
  thumbnail: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity">) => Promise<void>;
  addItems: (items: Array<{ productId: string; quantity: number; productName: string; modelName: string; price: number; thumbnail: string }>) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  totalCount: number;
  totalAmount: number;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  addItems: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  totalCount: 0,
  totalAmount: 0,
  refresh: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const res = await fetch("/api/cart");
      if (res.ok) setItems(await res.json());
      else setItems([]);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (item: Omit<CartItem, "id" | "quantity">) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    await refresh();
  }, [user, refresh]);

  const addItems = useCallback(async (items: Array<{ productId: string; quantity: number; productName: string; modelName: string; price: number; thumbnail: string }>) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    await fetch("/api/cart/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    await refresh();
  }, [user, refresh]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    await fetch(`/api/cart/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (id: string) => {
    await fetch(`/api/cart/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, addItems, updateQuantity, removeItem, totalCount, totalAmount, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
