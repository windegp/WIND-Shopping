"use client";

import React, { useState } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { ChevronDown, Info, CreditCard, CheckCircle2, Phone, ShoppingBag } from 'lucide-react';

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "القليوبية", "الشرقية", "المنوفية", "الغربية", "البحيرة", "دمياط", "بورسعيد", "السويس", "الإسماعيلية", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal } = useCart();
  const SHIPPING_COST = 70; 
  const finalTotal = subtotal + SHIPPING_COST;

  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNum, setOrderNum] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); 

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

  const [errors, setErrors] = useState({});

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
        setErrors({...errors, [e.target.name]: false});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            formData, 
            cartItems, 
            total: finalTotal,
            subtotal,
            shipping: SHIPPING_COST,
            paymentMethod 
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

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={60} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-black mb-4">تم استلام طلبك بنجاح!</h1>
        <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl max-w-md mb-8 shadow-sm">
            <p className="text-gray-700 font-bold mb-2 text-lg">رقم الطلب: <span className="text-blue-600">#{orderNum}</span></p>
            <p className="text-gray-600 leading-relaxed">
                لقد أرسلنا تفاصيل الفاتورة إلى <span className="text-black font-medium">{formData.email}</span>.
                <br />
                سيتواصل معك فريق خدمة العملاء على الرقم <span className="text-black font-medium">{formData.phone}</span> لتأكيد موعد التسليم.
            </p>
        </div>
        <Link href="/" className="bg-black text-white px-12 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#333] font-sans text-sm" dir="rtl">
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row border-t border-gray-100">
        
        {/* --- القسم الأيمن (بيانات العميل) --- */}
        <div className="w-full lg:w-[60%] p-6 lg:p-12 border-l border-gray-200 order-2 lg:order-1">
          <div className="mb-8">
             <h1 className="text-3xl font-black italic tracking-tighter">WIND</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Contact */}
            <section>
              <h2 className="text-xl font-medium text-black mb-4">Contact</h2>
              <input 
                required type="email" name="email" placeholder="البريد الإلكتروني" onChange={handleInputChange}
                className={`w-full p-3.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-1 focus:ring-black outline-none transition-all`}
              />
            </section>

            {/* 2. Delivery */}
            <section>
              <h2 className="text-xl font-medium text-black mb-4">Delivery</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="firstName" placeholder="الاسم الأول (اختياري)" onChange={handleInputChange} className="p-3.5 border border-gray-300 rounded-lg outline-none" />
                  <input required type="text" name="lastName" placeholder="اسم العائلة" onChange={handleInputChange} className={`p-3.5 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none`} />
                </div>

                <input required type="text" name="address" placeholder="العنوان (الحي، الشارع، رقم المنزل)" onChange={handleInputChange} className={`w-full p-3.5 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none`} />
                
                <input type="text" name="landmark" placeholder="علامة مميزة (اختياري)" onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg outline-none" />

                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" name="city" placeholder="المدينة / المنطقة" onChange={handleInputChange} className={`p-3.5 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none`} />
                  <div className="relative">
                    <select name="governorate" value={formData.governorate} onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg appearance-none bg-white outline-none">
                      {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input required type="tel" name="phone" placeholder="رقم الهاتف" onChange={handleInputChange} className={`w-full p-3.5 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg outline-none text-left`} dir="ltr" />
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <input type="tel" name="altPhone" placeholder="رقم إضافي (اختياري)" onChange={handleInputChange} className="w-full p-3.5 border border-gray-300 rounded-lg outline-none text-left" dir="ltr" />
                </div>
              </div>
            </section>

            {/* 4. Payment */}
            <section>
              <h2 className="text-xl font-medium text-black mb-4">Payment</h2>
              <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                
                {/* الفيزا */}
                <label className={`flex flex-col p-4 border-b border-gray-200 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 accent-black" />
                      <span className="font-bold">بطاقة دفع / محفظة إلكترونية</span>
                    </div>
                    <CreditCard size={18} className="text-gray-400" />
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 p-4 bg-gray-100 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-300">
                      سيتم توجيهك لصفحة الدفع الآمنة (Kashier) لإتمام العملية.
                    </div>
                  )}
                </label>

                {/* إنستا باي */}
                <label className={`flex flex-col p-4 border-b border-gray-200 cursor-pointer transition-colors ${paymentMethod === 'instapay' ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={paymentMethod === 'instapay'} onChange={() => setPaymentMethod('instapay')} className="w-4 h-4 accent-black" />
                    <span className="font-bold">InstaPay (إنستا باي)</span>
                  </div>
                  {paymentMethod === 'instapay' && (
                    <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg shadow-inner">
                      <p className="text-gray-700 text-xs leading-relaxed">
                        حول المبلغ للرقم: <span className="font-mono font-black text-black text-sm">01026628476</span>
                        <br />
                        وأرسل صورة الإيصال واتساب لتأكيد الطلب.
                      </p>
                    </div>
                  )}
                </label>

                {/* كاش */}
                <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-blue-50' : 'bg-white'}`}>
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 accent-black" />
                  <span className="font-bold">الدفع عند الاستلام (Cash)</span>
                </label>
              </div>
            </section>

            <button type="submit" disabled={loading} className="w-full bg-[#1773B0] text-white font-black py-5 rounded-xl text-xl hover:bg-[#125d8f] transition shadow-lg active:scale-[0.98] disabled:bg-gray-400">
              {loading ? "جاري المعالجة..." : paymentMethod === 'card' ? "Pay now" : "Complete order"}
            </button>
          </form>
        </div>

        {/* --- القسم الأيسر (ملخص الطلب) --- */}
        <div className="w-full lg:w-[40%] bg-[#F9F9F9] p-6 lg:p-12 order-1 lg:order-2">
          <div className="sticky top-6">
            <h2 className="text-lg font-bold mb-6">Order Summary</h2>
            <div className="space-y-6 mb-8 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  {/* تعديل مكان الـ Badge ليكون خارج الصورة وواضح */}
                  <div className="relative w-20 h-24 bg-white border border-gray-200 rounded-xl shrink-0 shadow-sm">
                    <img src={item.image || item.images?.[0]} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                    <span className="absolute -top-3 -right-3 bg-black text-white text-[12px] w-6 h-6 flex items-center justify-center rounded-full z-20 font-bold shadow-lg border-2 border-white">
                        {item.qty}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 uppercase text-[13px] tracking-tight">{item.title}</h4>
                    <p className="text-gray-500 text-xs mt-1">المقاس: {item.selectedSize}</p>
                  </div>
                  <span className="text-sm font-black text-black">E£{item.price * item.qty}.00</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-sm border-t border-gray-200 pt-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-black">E£{subtotal}.00</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">Shipping <Info size={12}/></span>
                <span className="font-bold text-black">E£{SHIPPING_COST}.00</span>
              </div>
              <div className="flex justify-between items-center text-black pt-4 border-t border-gray-200 mt-4">
                <span className="text-xl font-black italic">Total</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-xs text-gray-500 font-bold">EGP</span>
                   {/* السعر الإجمالي بلون أسود صريح وواضح جداً */}
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