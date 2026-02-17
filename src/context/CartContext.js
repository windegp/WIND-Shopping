"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('wind_cart');
  };

  const addToCart = (product) => {
    setCartItems((prev) => {
      const exist = prev.find((item) => item.id === product.id && item.selectedSize === product.selectedSize);
      if (exist) {
        return prev.map((item) =>
          (item.id === product.id && item.selectedSize === product.selectedSize) 
          ? { ...item, qty: item.qty + 1 } 
          : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    openCart();
  };

  // --- تحديث الكمية (جديد) ---
  const updateQty = (id, selectedSize, delta) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.selectedSize === selectedSize) {
          const newQty = item.qty + delta;
          return { ...item, qty: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  };

  // --- حذف مع مراعاة المقاس (معدل) ---
  const removeFromCart = (id, selectedSize) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.selectedSize === selectedSize)));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  useEffect(() => {
    const savedCart = localStorage.getItem('wind_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) { console.error("Error loading cart"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wind_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQty, // تم التصدير
      clearCart, 
      isCartOpen, 
      toggleCart, 
      openCart, 
      closeCart,
      subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);