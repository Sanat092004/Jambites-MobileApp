import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  vendorId: string;
  vendorName: string;
}

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (item.vendorId !== vendorId) {
        setVendorId(item.vendorId);
        setVendorName(item.vendorName);
        return [{ ...item, quantity: 1 }];
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (!vendorId) {
      setVendorId(item.vendorId);
      setVendorName(item.vendorName);
    }
  }, [vendorId]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const updated = prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      if (updated.length === 0) {
        setVendorId(null);
        setVendorName(null);
      }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        const updated = prev.filter((i) => i.id !== itemId);
        if (updated.length === 0) {
          setVendorId(null);
          setVendorName(null);
        }
        return updated;
      }
      return prev.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setVendorId(null);
    setVendorName(null);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        vendorId,
        vendorName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
