"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { ChevronRight, MapPin, Phone, Mail, User, CreditCard, Lock, CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", 
  "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", 
  "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", 
  "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهج"
];

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal } = useCart();
  
  // تثبيت الشحن بـ 70 جنية مبدئياً للقاهرة
  const SHIPPING_COST = 70;
  const finalTotal = subtotal + SHIPPING_COST;

  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNum, setOrderNum] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    landmark: '', // علامة مميزة (جديد)
    city: '',
    governorate: 'القاهرة',
    phone: '',
    altPhone: '' // رقم إضافي (جديد)
  });

  // التأكد من تحميل الصفحة لضمان عدم حدوث Hydration Error
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "البريد الإلكتروني مطلوب";
    if (!formData.firstName) newErrors.firstName = "الاسم الأول مطلوب";
    if (!formData.lastName) newErrors.lastName = "اسم العائلة مطلوب";
    if (!formData.address) newErrors.address = "العنوان مطلوب";
    if (!formData.city) newErrors.city = "المدينة مطلوبة";
    if (!formData.phone || formData.phone.length < 11) newErrors.phone = "رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        // التمرير لأعلى لرؤية الأخطاء
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            formData, 
            cartItems, 
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

  if (!mounted) return null;

  // --- شاشة النجاح ---
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6" dir="rtl">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} strokeWidth={3} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">شكراً لطلبك!</h1>
          <p className="text-gray-500 mb-6">رقم الطلب: <span className="font-mono font-bold text-black text-lg">#{orderNum}</span></p>
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-600 border border-gray-200">
            تم إرسال تفاصيل الفاتورة إلى <span className="font-bold text-black">{formData.email}</span>. سيتم التواصل معك قريباً.
          </div>
          <Link href="/" className="block w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  // --- السلة فارغة ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <ShoppingBag size={64} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">حقيبة التسوق فارغة</h1>
        <Link href="/" className="mt-6 bg-[#F5C518] text-black px-10 py-3 rounded-xl font-bold hover:bg-[#e0b116] transition">
          تسوق الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-right font-sans" dir="rtl">
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* === القسم الأيمن: نموذج البيانات === */}
        <div className="w-full lg:w-[58%] px-4 py-8 lg:px-12 lg:py-12 xl:px-20 order-2 lg:order-1">
          {/* الشعار */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-3xl font-black tracking-tighter italic">WIND</Link>
          </div>

          {/* مسار التنقل Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-8">
            <Link href="/cart" className="hover:text-black text-blue-600 transition">سلة التسوق</Link>
            <ChevronRight size={14} />
            <span className="text-black font-bold">المعلومات والشحن</span>
            <ChevronRight size={14} />
            <span>الدفع</span>
          </nav>

          <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto lg:mx-0">
            
            {/* 1. معلومات الاتصال */}
            <section>
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-lg font-bold">معلومات الاتصال</h2>
                {/* رابط تسجيل الدخول إذا أردت إضافته مستقبلاً */}
              </div>
              
              <div className="space-y-3">
                <div className="relative group">
                    <input 
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`peer w-full bg-white border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder-transparent`}
                    placeholder="البريد الإلكتروني"
                    id="email"
                    />
                    <label htmlFor="email" className="absolute right-4 -top-2.5 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-black">
                        البريد الإلكتروني
                    </label>
                    {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
                </div>
              </div>
            </section>

            {/* 2. عنوان الشحن */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold mb-3">عنوان الشحن</h2>
              
              {/* الاسم الأول واسم العائلة - تم تقليل المسافة بينهم وبين الإيميل */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input type="text" name="firstName" placeholder="الاسم الأول" onChange={handleInputChange} 
                     className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition`} />
                   {errors.firstName && <span className="text-xs text-red-500 absolute -bottom-5 right-0">{errors.firstName}</span>}
                </div>
                <div className="relative">
                   <input type="text" name="lastName" placeholder="اسم العائلة" onChange={handleInputChange} 
                      className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition`} />
                   {errors.lastName && <span className="text-xs text-red-500 absolute -bottom-5 right-0">{errors.lastName}</span>}
                </div>
              </div>

              {/* العنوان */}
              <div className="pt-2">
                <input type="text" name="address" placeholder="العنوان (اسم الشارع، رقم العقار، رقم الشقة)" onChange={handleInputChange} 
                    className={`w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition`} />
              </div>

              {/* علامة مميزة (جديد) */}
              <div>
                <input type="text" name="landmark" placeholder="علامة مميزة (اختياري - مثلاً: بجوار مسجد النور)" onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition" />
              </div>

              {/* المحافظة والمدينة */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="relative">
                    <input type="text" name="city" placeholder="المدينة / المنطقة" onChange={handleInputChange} 
                        className={`w-full border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition`} />
                 </div>
                 <div className="relative">
                    <select name="governorate" value={formData.governorate} onChange={handleInputChange} className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none cursor-pointer">
                        {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                    </select>
                    <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
                 </div>
              </div>

              {/* رقم الهاتف */}
              <div className="relative pt-2">
                <div className="relative group">
                    <input type="tel" name="phone" placeholder="رقم الهاتف المحمول" onChange={handleInputChange} 
                        className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 pl-10 outline-none focus:border-black focus:ring-1 focus:ring-black transition text-left dir-ltr`} dir="ltr" />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none transition-opacity opacity-0 group-focus-within:opacity-100">سنتصل بك لتأكيد الطلب</span>
                </div>
                {errors.phone && <span className="text-xs text-red-500 block mt-1">{errors.phone}</span>}
              </div>

              {/* رقم هاتف إضافي (جديد) */}
              <div>
                <input type="tel" name="altPhone" placeholder="رقم هاتف إضافي (اختياري)" onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black transition text-left" dir="ltr" />
              </div>

            </section>

            {/* 3. الشحن والدفع */}
            <section className="space-y-4 pt-4 border-t border-gray-100">
                <h2 className="text-lg font-bold">طريقة الشحن والدفع</h2>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-medium">الشحن القياسي (القاهرة)</span>
                    <span className="font-bold">{SHIPPING_COST} EGP</span>
                </div>

                <div className="border border-black bg-[#fbfbfb] p-4 rounded-lg flex items-center justify-between cursor-default relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-black"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-[6px] border-black bg-white"></div>
                        <div>
                            <span className="block font-bold text-gray-900 text-sm">الدفع عند الاستلام (COD)</span>
                            <span className="text-xs text-gray-500">الدفع نقداً للكابتن عند استلام الطلب</span>
                        </div>
                    </div>
                    <CreditCard className="text-gray-400" size={20} />
                </div>
            </section>

            {/* زر الإرسال */}
            <div className="pt-6">
              <button type="submit" disabled={loading} className="w-full bg-[#121212] text-white font-bold py-5 rounded-xl text-xl hover:bg-black transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl">
                {loading ? "جاري تسجيل الطلب..." : `إتمام الطلب • ${finalTotal} EGP`}
              </button>
            </div>
          </form>

          <footer className="mt-12 border-t pt-6 text-xs text-gray-400 flex flex-wrap gap-4 justify-center">
             <span>سياسة الاسترجاع</span>
             <span>سياسة الخصوصية</span>
             <span>شروط الاستخدام</span>
          </footer>
        </div>

        {/* === القسم الأيسر: ملخص الطلب (Sticky Sidebar) === */}
        <div className="w-full lg:w-[42%] bg-[#fafafa] border-r border-gray-200 order-1 lg:order-2">
            <div className="sticky top-0 h-full max-h-screen overflow-y-auto p-4 py-8 lg:px-10 lg:py-12">
                
                {/* قائمة المنتجات */}
                <div className="space-y-4 mb-8">
                    {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center group">
                        <div className="relative w-16 h-20 border border-gray-200 rounded-lg bg-white shrink-0 overflow-hidden">
                            {/* إصلاح مسار الصور: محاولة استخدام مسار المجلد أو المسار المباشر */}
                            <img 
                                src={item.image ? item.image : `/images/products/${item.folderName}/${item.mainImage}`} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                onError={(e) => {e.target.src = 'https://placehold.co/60x80?text=No+Img'}} // صورة بديلة في حال الخطأ
                            />
                            <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md z-10">
                                {item.qty}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm text-gray-800 line-clamp-2">{item.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{item.selectedSize ? `المقاس: ${item.selectedSize}` : ''}</p>
                        </div>
                        <div className="font-medium text-sm text-gray-900">{item.price} EGP</div>
                    </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 my-6"></div>

                {/* كود الخصم (يمكن تفعيله لاحقاً) */}
                <div className="flex gap-2 mb-6">
                    <input type="text" placeholder="كود الخصم" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black transition" disabled />
                    <button className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed" disabled>تطبيق</button>
                </div>

                <div className="border-t border-gray-200 my-6"></div>

                {/* الحسابات المالية */}
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>المجموع الفرعي</span>
                        <span className="font-medium">{subtotal} EGP</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <span>الشحن</span>
                            <AlertCircle size={12} className="text-gray-400" />
                        </div>
                        <span className="font-medium">{SHIPPING_COST} EGP</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 mt-6 pt-6">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">الإجمالي الكلي</span>
                        <div className="text-right">
                            <span className="text-xs text-gray-500 block">شاملاً الضريبة</span>
                            <span className="text-2xl font-black tracking-tight">{finalTotal} <span className="text-sm font-bold">EGP</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}