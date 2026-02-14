"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // --- الإضافة الجديدة: دالة مسح السلة بعد إتمام الطلب ---
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
          ? { ...exist, qty: exist.qty + 1 } 
          : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    openCart();
  };

  const removeFromCart = (id, selectedSize) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.selectedSize === selectedSize)));
  };

  // --- الإضافة الجديدة: حساب الإجمالي ليكون متاحاً في كل الموقع ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const shipping = 50; 
  const total = subtotal + shipping;

  useEffect(() => {
    const savedCart = localStorage.getItem('wind_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart");
      }
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
      clearCart, // تصدير الدالة
      isCartOpen, 
      toggleCart, 
      openCart, 
      closeCart,
      subtotal, // تصدير الحسابات
      total,
      shipping
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);