"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { ChevronDown, Info, CreditCard, Banknote, CheckCircle2, Phone } from 'lucide-react';

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "القليوبية", "الشرقية", "المنوفية", "الغربية", "البحيرة", "دمياط", "بورسعيد", "السويس", "الإسماعيلية", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal } = useCart();
  const SHIPPING_COST = 70; // شحن ثابت 70 جنية
  const finalTotal = subtotal + SHIPPING_COST;

  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // الافتراضي فيزا كما في الصورة

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    landmark: '',
    city: '',
    governorate: 'القاهرة',
    postalCode: '',
    phone: '',
    altPhone: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!formData.email) tempErrors.email = true;
    if (!formData.firstName) tempErrors.firstName = true;
    if (!formData.lastName) tempErrors.lastName = true;
    if (!formData.address) tempErrors.address = true;
    if (!formData.city) tempErrors.city = true;
    if (!formData.phone || formData.phone.length < 11) tempErrors.phone = true;
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return window.scrollTo(0, 0);
    
    setLoading(true);
    // محاكاة إرسال الطلب
    setTimeout(() => {
      setOrderCompleted(true);
      clearCart();
      setLoading(false);
    }, 2000);
  };

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <CheckCircle2 size={80} className="text-green-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2">تم استلام طلبك بنجاح!</h1>
        <p className="text-gray-600 mb-8">سنتواصل معك هاتفياً لتأكيد الشحن.</p>
        <Link href="/" className="bg-black text-white px-8 py-3 rounded-md font-bold">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#333] font-sans text-sm" dir="rtl">
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row border-t border-gray-100">
        
        {/* --- القسم الأيمن (البيانات) --- */}
        <div className="w-full lg:w-[60%] p-6 lg:p-12 border-l border-gray-200 order-2 lg:order-1">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Contact */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-black">Contact</h2>
                <Link href="#" className="text-blue-600 underline text-xs">Sign in</Link>
              </div>
              <input 
                type="email" name="email" placeholder="Email" onChange={handleInputChange}
                className={`w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-1 focus:ring-black outline-none`}
              />
              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" id="news" className="w-4 h-4 accent-black" />
                <label htmlFor="news" className="text-xs text-gray-600">Email me with news and offers</label>
              </div>
            </section>

            {/* 2. Delivery */}
            <section>
              <h2 className="text-xl font-medium text-black mb-4">Delivery</h2>
              <div className="space-y-3">
                <select className="w-full p-3 border border-gray-300 rounded-md bg-gray-50">
                  <option>Egypt</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="firstName" placeholder="First name" onChange={handleInputChange} className={`p-3 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`} />
                  <input type="text" name="lastName" placeholder="Last name" onChange={handleInputChange} className={`p-3 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`} />
                </div>

                <input type="text" name="address" placeholder="Address" onChange={handleInputChange} className={`w-full p-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`} />
                
                <input type="text" name="landmark" placeholder="Apartment, suite, etc. (Landmark - Optional)" onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md outline-none" />

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="city" placeholder="City" onChange={handleInputChange} className={`p-3 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`} />
                  <div className="relative">
                    <select name="governorate" value={formData.governorate} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md appearance-none bg-white outline-none">
                      {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="postalCode" placeholder="Postal code (optional)" onChange={handleInputChange} className="p-3 border border-gray-300 rounded-md outline-none" />
                  <div className="relative">
                    <input type="tel" name="phone" placeholder="Phone" onChange={handleInputChange} className={`w-full p-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md outline-none`} />
                    <Info size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <input type="tel" name="altPhone" placeholder="Additional Phone (Optional)" onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md outline-none" />
              </div>
            </section>

            {/* 3. Shipping Method */}
            <section>
              <h2 className="text-lg font-medium text-black mb-3">Shipping method</h2>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
                <span className="text-sm">Standard</span>
                <span className="font-bold">E£{SHIPPING_COST}.00</span>
              </div>
            </section>

            {/* 4. Payment */}
            <section>
              <h2 className="text-xl font-medium text-black mb-1">Payment</h2>
              <p className="text-xs text-gray-500 mb-4">All transactions are secure and encrypted.</p>
              
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {/* الفيزا */}
                <label className={`flex flex-col p-4 border-b border-gray-200 cursor-pointer ${paymentMethod === 'card' ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 accent-black" />
                      <span className="font-medium">Pay with Card / Wallet (Kashier)</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-8 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">VISA</div>
                      <div className="w-8 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[8px] font-bold">M/C</div>
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 p-4 bg-gray-100 text-center text-xs text-gray-600 rounded">
                      سيتم توجيهك لصفحة الدفع الآمنة لإتمام العملية.
                    </div>
                  )}
                </label>

                {/* كاش عند الاستلام */}
                <label className={`flex items-center gap-3 p-4 border-b border-gray-200 cursor-pointer ${paymentMethod === 'cod' ? 'bg-blue-50' : 'bg-white'}`}>
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 accent-black" />
                  <span className="font-medium text-sm">Cash on delivery (الدفع عند الاستلام)</span>
                </label>

                {/* إنستا باي */}
                <label className={`flex flex-col p-4 cursor-pointer ${paymentMethod === 'instapay' ? 'bg-blue-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={paymentMethod === 'instapay'} onChange={() => setPaymentMethod('instapay')} className="w-4 h-4 accent-black" />
                    <span className="font-medium text-sm">InstaPay (إنستا باي)</span>
                  </div>
                  {paymentMethod === 'instapay' && (
                    <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg text-right animate-in fade-in slide-in-from-top-2">
                      <p className="font-bold text-blue-900 mb-2">شكراً لاختيارك ويند</p>
                      <p className="text-gray-700 text-xs leading-relaxed">
                        يرجى تحويل المبلغ عبر إنستا باي للرقم: <span className="font-mono font-black text-black text-sm select-all">01026628476</span>
                        <br />
                        وإرسال صورة الإيصال (واتساب) على نفس الرقم لتجهيز طلبك فوراً.
                      </p>
                      <a href="https://wa.me/201026628476" target="_blank" className="inline-flex items-center gap-2 mt-3 text-green-600 font-bold text-xs hover:underline">
                        <Phone size={14} /> إرسال الإيصال الآن
                      </a>
                    </div>
                  )}
                </label>
              </div>
            </section>

            <button type="submit" disabled={loading} className="w-full bg-[#1773B0] text-white font-bold py-4 rounded-md text-lg hover:bg-[#125d8f] transition shadow-md">
              {loading ? "Processing..." : paymentMethod === 'card' ? "Pay now" : "Complete order"}
            </button>

            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200 text-[10px] text-blue-600 underline">
                <Link href="#">Refund policy</Link>
                <Link href="#">Shipping policy</Link>
                <Link href="#">Privacy policy</Link>
                <Link href="#">Terms of service</Link>
            </div>
          </form>
        </div>

        {/* --- القسم الأيسر (ملخص الطلب) --- */}
        <div className="w-full lg:w-[40%] bg-[#F5F5F5] p-6 lg:p-12 order-1 lg:order-2">
          <div className="sticky top-6">
            <div className="space-y-4 mb-8">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0">
                    <img src={item.image || item.images?.[0] || 'https://placehold.co/100'} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full z-10">{item.qty}</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-gray-800">{item.title}</h4>
                    <p className="text-gray-500">{item.selectedSize}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">E£{item.price * item.qty}.00</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <input type="text" placeholder="Discount code" className="flex-1 p-2.5 border border-gray-300 rounded-md outline-none focus:border-black" />
              <button className="bg-gray-200 text-gray-500 px-4 py-2 rounded-md font-bold text-xs" disabled>Apply</button>
            </div>

            <div className="space-y-3 text-sm border-t border-gray-200 pt-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-black">E£{subtotal}.00</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-black">E£{SHIPPING_COST}.00</span>
              </div>
              <div className="flex justify-between items-center text-black pt-2">
                <span className="text-lg font-bold">Total</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-xs text-gray-500">EGP</span>
                   {/* تعديل لون ووضوح السعر الإجمالي */}
                   <span className="text-2xl font-black text-black tracking-tighter">E£{finalTotal}.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}