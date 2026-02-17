"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { ChevronRight, Phone, CheckCircle, ShoppingBag, CreditCard, Info } from 'lucide-react';

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "القليوبية", "الشرقية", "المنوفية", "الغربية", "البحيرة", "دمياط", "بورسعيد", "السويس", "الإسماعيلية", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal } = useCart();
  
  // إعدادات الشحن والإجمالي
  const SHIPPING_COST = 70;
  const finalTotal = subtotal + SHIPPING_COST;

  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNum, setOrderNum] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); 
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    landmark: '', 
    city: '',
    governorate: 'القاهرة',
    phone: '',
    altPhone: '' 
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.email) tempErrors.email = true;
    if (!formData.lastName) tempErrors.lastName = true;
    if (!formData.address) tempErrors.address = true;
    if (!formData.city) tempErrors.city = true;
    if (!formData.phone || formData.phone.length < 11) tempErrors.phone = true;
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);

    try {
      // إرسال كافة البيانات للـ API لضمان وصول الإيميل بشكل صحيح
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formData, 
          cartItems, 
          paymentMethod, // إرسال طريقة الدفع المختار
          subtotal,
          shipping: SHIPPING_COST,
          total: finalTotal 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderNum(data.orderNumber);
        setOrderCompleted(true);
        clearCart();
        window.scrollTo(0, 0);
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

  // --- شاشة النجاح (المحسنة التي طلبتها) ---
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-black p-4 text-center" dir="rtl">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-black mb-2">شكراً لك، تم استلام طلبك!</h1>
        <p className="text-gray-600 mb-6 font-bold text-lg">رقم طلبك هو: <span className="text-blue-600">#{orderNum}</span></p>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 max-w-md mb-8">
            <p className="text-gray-700 leading-relaxed">
                لقد أرسلنا تفاصيل الطلب إلى <span className="font-bold text-black">{formData.email}</span>.
                <br />
                سنتواصل معك هاتفياً على الرقم <span className="font-bold text-black">{formData.phone}</span> قريباً لتأكيد الشحن.
            </p>
        </div>
        <Link href="/" className="bg-[#121212] text-white px-10 py-4 rounded-md font-bold hover:bg-black transition shadow-lg">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-right font-sans text-sm" dir="rtl">
      <div className="max-w-[1150px] mx-auto flex flex-col lg:flex-row border-t border-gray-100">
        
        {/* --- القسم الأيمن (البيانات) --- */}
        <div className="w-full lg:w-[60%] p-6 lg:p-12 border-l border-gray-200 order-2 lg:order-1">
          <div className="mb-8">
             <Link href="/" className="text-3xl font-black tracking-tighter italic">WIND</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Contact */}
            <section>
              <h2 className="text-xl font-medium text-black mb-4">Contact</h2>
              <input 
                required name="email" type="email" placeholder="البريد الإلكتروني" onChange={handleInputChange}
                className={`w-full p-3.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-1 focus:ring-black outline-none transition-all`}
              />
            </section>

            {/* 2. Delivery */}
            <section className="!mt-4">
              <h2 className="text-xl font-medium text-black mb-4">Delivery</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="firstName" placeholder="الاسم الأول (اختياري)" onChange={handleInputChange} className="p-3.5 border border-gray-300 rounded-lg outline-none" />
                  <input required type="text" name="lastName" placeholder="اسم العائلة" onChange={handleInputChange} className={`p-3.5 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none`} />
                </div>

                <input required type="text" name="address" placeholder="العنوان (الحي، الشارع، رقم المنزل)" onChange={handleInputChange} className={`w-full p-3.5 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none`} />
                
                <input type="text" name="landmark" placeholder="علامة مميزة (اختياري - مثلاً بجوار مسجد)" onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg outline-none" />

                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" name="city" placeholder="المدينة / المنطقة" onChange={handleInputChange} className={`p-3.5 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none`} />
                  <select name="governorate" value={formData.governorate} onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg bg-white outline-none">
                      {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <input required type="tel" name="phone" placeholder="رقم الهاتف المحمول" onChange={handleInputChange} className={`w-full p-3.5 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none text-left`} dir="ltr" />
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <input type="tel" name="altPhone" placeholder="رقم إضافي (اختياري)" onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg outline-none text-left" dir="ltr" />
                </div>
              </div>
            </section>

            {/* 3. Payment */}
            <section className="pt-4 border-t border-gray-100">
              <h2 className="text-xl font-medium text-black mb-4">Payment</h2>
              <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                
                {/* الفيزا */}
                <label className={`flex flex-col p-4 border-b border-gray-200 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 accent-black" />
                      <span className="font-bold">الدفع بالبطاقة / المحافظ الإلكترونية</span>
                    </div>
                    <div className="flex gap-1">
                      <CreditCard size={20} className="text-gray-400" />
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 p-4 bg-gray-100 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-300">
                      سيتم إضافة بوابة الدفع الخاصة بك هنا (Kashier / Fawry).
                    </div>
                  )}
                </label>

                {/* إنستا باي */}
                <label className={`flex flex-col p-4 border-b border-gray-200 cursor-pointer transition-colors ${paymentMethod === 'instapay' ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={paymentMethod === 'instapay'} onChange={() => setPaymentMethod('instapay')} className="w-4 h-4 accent-black" />
                    <span className="font-bold">تحويل إنستا باي (InstaPay)</span>
                  </div>
                  {paymentMethod === 'instapay' && (
                    <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg text-right shadow-inner">
                      <p className="font-black text-blue-900 mb-2">شكراً لاختيارك ويند</p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        يرجى تحويل المبلغ عبر إنستا بای للرقم: <span className="font-mono font-black text-black bg-yellow-100 px-1">01026628476</span>
                        <br />
                        وإرسال صورة الإيصال (واتساب) على نفس الرقم لتجهيز طلبك فوراً.
                      </p>
                      <a href="https://wa.me/201026628476" target="_blank" className="inline-flex items-center gap-2 mt-4 text-green-600 font-bold hover:underline">
                        <Phone size={14} /> إرسال الإيصال عبر واتساب
                      </a>
                    </div>
                  )}
                </label>

                {/* كاش */}
                <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-blue-50' : 'bg-white'}`}>
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 accent-black" />
                  <span className="font-bold">الدفع عند الاستلام (Cash on Delivery)</span>
                </label>
              </div>
            </section>

            <button type="submit" disabled={loading} className="w-full bg-[#1773B0] text-white font-black py-5 rounded-xl text-xl hover:bg-[#125d8f] transition shadow-xl active:scale-[0.98] disabled:bg-gray-400">
              {loading ? "جاري المعالجة..." : paymentMethod === 'card' ? "Pay now" : "Complete order"}
            </button>

          </form>
        </div>

        {/* --- القسم الأيسر (ملخص الطلب) --- */}
        <div className="w-full lg:w-[40%] bg-[#F9F9F9] p-6 lg:p-12 order-1 lg:order-2">
          <div className="sticky top-6">
            <h2 className="text-xl font-bold mb-6 text-black border-b pb-4">Order Summary</h2>
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="relative w-16 h-20 bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <img src={item.image || (item.images && item.images[0])} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full z-10 font-bold">{item.qty}</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-gray-800 uppercase">{item.title}</h4>
                    <p className="text-gray-500 mt-1">Size: {item.selectedSize}</p>
                  </div>
                  <span className="text-sm font-black text-black">E£{item.price * item.qty}.00</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm border-t border-gray-200 pt-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-black">E£{subtotal}.00</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">Shipping <Info size={12}/></span>
                <span className="font-bold text-black">E£{SHIPPING_COST}.00</span>
              </div>
              <div className="flex justify-between items-center text-black pt-4 border-t border-gray-200 mt-4">
                <span className="text-xl font-black">Total</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-xs text-gray-500 font-bold">EGP</span>
                   {/* السعر النهائي بلون أسود صريح وخط عريض جداً */}
                   <span className="text-3xl font-black text-black tracking-tighter">E£{finalTotal}.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}