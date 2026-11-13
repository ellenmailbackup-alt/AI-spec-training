import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  productId: number;
  priceId: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  category: string;
  grindSize?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: number, priceId: number, grindSize?: string) => void;
  updateQuantity: (productId: number, priceId: number, quantity: number, grindSize?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kruze_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.priceId === item.priceId && i.grindSize === item.grindSize
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.priceId === item.priceId && i.grindSize === item.grindSize
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: number, priceId: number, grindSize?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.priceId === priceId && i.grindSize === grindSize))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: number, priceId: number, quantity: number, grindSize?: string) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter(
            (i) => !(i.productId === productId && i.priceId === priceId && i.grindSize === grindSize)
          )
        );
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.productId === productId && i.priceId === priceId && i.grindSize === grindSize
              ? { ...i, quantity }
              : i
          )
        );
      }
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
