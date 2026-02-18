"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // --- الجزء الجديد: أكواد الخصم والشحن ---
  const [appliedPromo, setAppliedPromo] = useState(""); // لحفظ الكود المفعل
  const [discountError, setDiscountError] = useState(""); // لرسائل الخطأ

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(""); // مسح الكود عند تفريغ السلة
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

  const removeFromCart = (id, selectedSize) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.selectedSize === selectedSize)));
  };

  // --- الحسابات المالية (مطورة) ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  // الشحن يكون 0 لو الكود "free" و 70 في الحالات العادية
  const shipping = appliedPromo.toLowerCase() === "free" ? 0 : 70;
  const total = subtotal + shipping;

  // دالة تطبيق الكود
  const applyPromoCode = (code) => {
    if (code.toLowerCase() === "free") {
      setAppliedPromo("free");
      setDiscountError("");
      return { success: true, message: "تم تفعيل الشحن المجاني بنجاح!" };
    } else {
      setAppliedPromo("");
      setDiscountError("عذراً، هذا الكود غير صالح");
      return { success: false, message: "كود خصم غير صحيح" };
    }
  };

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
      updateQty,
      clearCart, 
      isCartOpen, 
      toggleCart, 
      openCart, 
      closeCart,
      subtotal,
      // القيم الجديدة المصدرة للموقع
      shipping,
      total,
      appliedPromo,
      applyPromoCode,
      discountError
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);