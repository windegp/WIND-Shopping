"use client";

import React, { useState } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal, shipping, total } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNum, setOrderNum] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    governorate: 'القاهرة',
    phone: ''
  });

  const handleInputChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, cartItems, total }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderNum(data.orderNumber);
        setOrderCompleted(true);
        clearCart();
      } else {
        alert("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-black p-4 text-center" dir="rtl">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-2">شكراً لك، تم استلام طلبك!</h1>
        <p className="text-gray-600 mb-6 font-bold">رقم طلبك هو: <span className="text-blue-600">#{orderNum}</span></p>
        <p className="text-gray-500 max-w-md mb-8">لقد أرسلنا تفاصيل الطلب إلى {formData.email}. سيتم التواصل معك هاتفياً قريباً لتأكيد الشحن.</p>
        <Link href="/" className="bg-[#121212] text-white px-10 py-4 rounded-md font-bold hover:bg-black transition">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-3xl font-black mb-6">حقيبة التسوق فارغة</h1>
        <Link href="/" className="bg-[#F5C518] text-black px-8 py-3 rounded-md font-black hover:bg-white transition">
          العودة للتسوق
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 text-black text-right" dir="rtl">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter italic">WIND</h1>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8 order-2 lg:order-1">
            <section>
              <h2 className="text-xl font-bold mb-4 border-b pb-2">معلومات الاتصال</h2>
              <input required name="email" type="email" onChange={handleInputChange} className="w-full border border-gray-300 p-4 rounded-lg outline-none focus:ring-2 focus:ring-black transition" placeholder="البريد الإلكتروني" />
            </section>
            <section>
              <h2 className="text-xl font-bold mb-4 border-b pb-2">تفاصيل العنوان</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input name="firstName" type="text" onChange={handleInputChange} className="border border-gray-300 p-4 rounded-lg outline-none focus:ring-2 focus:ring-black" placeholder="الاسم الأول (اختياري)" />
                <input required name="lastName" type="text" onChange={handleInputChange} className="border border-gray-300 p-4 rounded-lg outline-none focus:ring-2 focus:ring-black" placeholder="اسم العائلة" />
              </div>
              <input required name="address" type="text" onChange={handleInputChange} className="w-full border border-gray-300 p-4 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-black" placeholder="العنوان (الحي، الشارع، رقم المنزل)" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input required name="city" type="text" onChange={handleInputChange} className="border border-gray-300 p-4 rounded-lg outline-none focus:ring-2 focus:ring-black" placeholder="المدينة / المنطقة" />
                <select name="governorate" onChange={handleInputChange} className="border border-gray-300 p-4 rounded-lg bg-white outline-none focus:ring-2 focus:ring-black">
                  <option value="القاهرة">القاهرة</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="الدقهلية">الدقهلية</option>
                </select>
              </div>
              <input required name="phone" type="tel" onChange={handleInputChange} className="w-full border border-gray-300 p-4 rounded-lg outline-none focus:ring-2 focus:ring-black text-left" placeholder="رقم الهاتف المحمول" />
            </section>
            <section>
              <h2 className="text-xl font-bold mb-4 border-b pb-2">طريقة الدفع</h2>
              <div className="border-2 border-black bg-gray-50 p-5 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold block text-lg">الدفع عند الاستلام</span>
                  <span className="text-sm text-gray-500">ادفع نقداً عند باب منزلك</span>
                </div>
                <div className="w-6 h-6 border-4 border-black rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                </div>
              </div>
            </section>
            <button type="submit" disabled={loading} className="w-full bg-black text-white font-black py-6 rounded-lg text-2xl hover:bg-gray-800 transition-all active:scale-[0.98] disabled:bg-gray-400">
              {loading ? "جاري معالجة طلبك..." : "تأكيد الطلب الآن"}
            </button>
          </div>
          <div className="order-1 lg:order-2 bg-gray-50 p-8 rounded-2xl h-fit border border-gray-200 sticky top-8">
            <h2 className="text-2xl font-black mb-8 pb-4 border-b">ملخص طلبك</h2>
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-24 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <img src={`/images/products/${item.folderName}/${item.mainImage}`} className="w-full h-full object-cover group-hover:scale-105 transition" alt={item.title} />
                      <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-lg">{item.qty}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base uppercase tracking-tight">{item.title}</h3>
                      <p className="text-gray-500 text-sm font-medium">المقاس: {item.selectedSize}</p>
                    </div>
                  </div>
                  <span className="font-black text-lg">{item.price} EGP</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-gray-200 pt-8">
              <div className="flex justify-between text-gray-600 font-medium"><span>المجموع الفرعي</span><span>{subtotal} EGP</span></div>
              <div className="flex justify-between text-gray-600 font-medium"><span>تكلفة الشحن</span><span>{shipping} EGP</span></div>
              <div className="flex justify-between text-2xl font-black pt-6 text-black border-t mt-4"><span>الإجمالي الكلي</span><span>{total} EGP</span></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}