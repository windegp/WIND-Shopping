"use client";
import { useCart } from "../../context/CartContext";
import Link from "next/link";

export default function CartDrawer() {
  const { cartItems, isCartOpen, toggleCart, removeFromCart, updateQty, subtotal } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden" dir="rtl">
      {/* الخلفية الشفافة */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={toggleCart} />
      
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[#121212] shadow-2xl flex flex-col border-r border-[#333]">
          
          {/* الهيدر */}
          <div className="p-6 border-b border-[#333] flex items-center justify-between bg-[#1a1a1a]">
            <div>
              <h2 className="text-xl font-black text-white">حقيبة التسوق</h2>
              <p className="text-[#F5C518] text-xs font-bold mt-1">{cartItems.length} منتجات في الحقيبة</p>
            </div>
            <button onClick={toggleCart} className="text-white hover:rotate-90 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* قائمة المنتجات */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-6 opacity-20 flex justify-center">
                   <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth="1"/></svg>
                </div>
                <p className="text-gray-400 font-bold mb-6">حقيبتك فارغة، ابدأ بإضافة بعض الأناقة!</p>
                <button onClick={toggleCart} className="bg-[#F5C518] text-black px-10 py-3 rounded-sm font-black transition active:scale-95">تسوق الآن</button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 bg-[#1a1a1a] p-3 rounded-sm border border-[#222] group hover:border-[#333] transition-colors">
                  {/* صورة المنتج */}
                  <div className="w-24 h-32 bg-[#222] rounded overflow-hidden flex-shrink-0 border border-[#333]">
                    <img 
                      // تأكد من أن المسار يطابق طريقة تخزينك (ممكن تستخدم item.image مباشرة لو هي رابط كامل)
                      src={item.image || `/images/products/${item.folderName}/${item.mainImage}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>

                  {/* تفاصيل المنتج */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-bold text-sm leading-tight max-w-[150px]">{item.title}</h3>
                        <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-gray-500 hover:text-red-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <p className="text-[#F5C518] text-[10px] font-black mt-1 uppercase tracking-tighter">المقاس: {item.selectedSize}</p>
                    </div>

                    <div className="flex justify-between items-end">
                      {/* عداد الكمية */}
                      <div className="flex items-center border border-[#333] rounded-sm bg-[#121212]">
                        <button onClick={() => updateQty(item.id, item.selectedSize, -1)} className="px-3 py-1 text-white hover:bg-[#222]">-</button>
                        <span className="px-2 text-xs font-bold text-[#F5C518] min-w-[20px] text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.selectedSize, 1)} className="px-3 py-1 text-white hover:bg-[#222]">+</button>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-black text-sm">{item.price * item.qty} EGP</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* الجزء السفلي (المجموع والتشيك أوت) */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-[#1a1a1a] border-t border-[#333] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-sm">المجموع الفرعي</span>
                  <span className="text-white font-bold">{subtotal} EGP</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 italic">سيتم احتساب مصاريف الشحن عند إتمام الطلب</span>
                  <span className="text-[#F5C518] font-bold">حسب المحافظة</span>
                </div>
              </div>

              <Link 
                href="/checkout" 
                onClick={toggleCart}
                className="group relative block w-full bg-[#F5C518] text-black text-center font-black py-4 rounded-sm text-lg overflow-hidden transition-all active:scale-95"
              >
                <span className="relative z-10">إتمام الطلب الآن</span>
                <div className="absolute inset-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="absolute inset-0 flex items-center justify-center text-black font-black opacity-0 group-hover:opacity-100 z-20 transition-opacity duration-300">
                   يلا بينا! ➔
                </span>
              </Link>
              
              <button onClick={toggleCart} className="w-full text-gray-500 font-bold text-xs mt-4 hover:text-white transition uppercase tracking-widest">إكمال التسوق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}