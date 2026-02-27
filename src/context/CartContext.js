"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [appliedPromo, setAppliedPromo] = useState("");
  const [discountError, setDiscountError] = useState("");

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo("");
    localStorage.removeItem('wind_cart');
  };

  const addToCart = (product) => {
    setCartItems((prev) => {
      // ✅ إصلاح البق: التطابق على id + selectedSize + selectedColor معاً
      // قبل كان بيتطابق على id + selectedSize فقط
      // لو نفس المنتج باللون التاني → selectedColor مختلف → يُضاف كصنف جديد مستقل
      const exist = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === product.selectedSize &&
          item.selectedColor === product.selectedColor  // ← الإضافة الوحيدة
      );
      if (exist) {
        return prev.map((item) =>
          (item.id === product.id &&
           item.selectedSize === product.selectedSize &&
           item.selectedColor === product.selectedColor)  // ← نفس الشرط
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    openCart();
  };

  const updateQty = (id, selectedSize, delta, selectedColor) => {
    setCartItems((prev) =>
      prev.map((item) => {
        // ✅ updateQty كمان محتاج يميز اللون عشان يعدّل الصنف الصح
        const matchColor = selectedColor !== undefined
          ? item.selectedColor === selectedColor
          : true; // لو مفيش color → تشتغل زي الأول (backward compatible)
        if (item.id === id && item.selectedSize === selectedSize && matchColor) {
          const newQty = item.qty + delta;
          return { ...item, qty: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id, selectedSize, selectedColor) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        // ✅ removeFromCart كمان محتاج يميز اللون عشان يحذف الصنف الصح
        const matchColor = selectedColor !== undefined
          ? item.selectedColor === selectedColor
          : true;
        return !(item.id === id && item.selectedSize === selectedSize && matchColor);
      })
    );
  };

  // الحسابات المالية — لم تتغير
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const shipping = appliedPromo.toLowerCase() === "free" ? 0 : 70;
  const total = subtotal + shipping;

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