"use client";
import { useCart } from "../../context/CartContext";
import Link from "next/link";

export default function CartDrawer() {
  const { cartItems, isCartOpen, toggleCart, removeFromCart } = useCart();

  if (!isCartOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" dir="rtl">
      {/* الخلفية الشفافة */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleCart} />
      
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[#121212] shadow-2xl border-r border-[#333] flex flex-col">
          
          {/* الهيدر */}
          <div className="p-6 border-b border-[#333] flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">حقيبة التسوق ({cartItems.length})</h2>
            <button onClick={toggleCart} className="text-gray-400 hover:text-[#F5C518] transition">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* قائمة المنتجات */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 font-bold mb-6">حقيبتك فارغة حالياً..</p>
                <button onClick={toggleCart} className="text-[#F5C518] border border-[#F5C518] px-6 py-2 rounded-md font-black hover:bg-[#F5C518] hover:text-black transition">ابدأ التسوق</button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="flex gap-4 border-b border-[#222] pb-6">
                  <div className="w-20 h-28 bg-[#1a1a1a] rounded overflow-hidden flex-shrink-0 border border-[#333]">
                    <img src={`/images/products/${item.folderName}/${item.mainImage}`} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-white font-black text-sm uppercase">{item.title}</h3>
                    <p className="text-[#F5C518] text-xs font-bold">المقاس: {item.selectedSize}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-white font-black">{item.price} EGP</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs font-bold hover:underline">حذف</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* الجزء السفلي (المجموع) */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-[#1a1a1a] border-t border-[#333] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold text-lg">الإجمالي:</span>
                <span className="text-[#F5C518] text-2xl font-black">{total} EGP</span>
              </div>
              <Link 
                href="/checkout" 
                onClick={toggleCart}
                className="block w-full bg-[#F5C518] text-black text-center font-black py-4 rounded-md text-lg hover:bg-white transition-all shadow-lg"
              >
                إتمام الطلب الآن
              </Link>
              <button onClick={toggleCart} className="w-full text-gray-400 font-bold text-sm hover:text-white transition">إكمال التسوق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}