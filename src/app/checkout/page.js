"use client";

import React, { useState } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { ChevronRight, MapPin, Phone, Mail, User, CreditCard, Lock, CheckCircle, ShoppingBag } from 'lucide-react';

// قائمة المحافظات المصرية كاملة لتحسين التجربة
const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", 
  "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", 
  "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", 
  "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهج"
];

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal, shipping, total } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNum, setOrderNum] = useState(null);

  // حالة للتحقق من الأخطاء (Validation)
  const [errors, setErrors] = useState({});

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // إزالة الخطأ عند الكتابة
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "البريد الإلكتروني مطلوب";
    if (!formData.firstName) newErrors.firstName = "الاسم الأول مطلوب";
    if (!formData.lastName) newErrors.lastName = "اسم العائلة مطلوب";
    if (!formData.address) newErrors.address = "العنوان مطلوب";
    if (!formData.city) newErrors.city = "المدينة مطلوبة";
    if (!formData.phone || formData.phone.length < 11) newErrors.phone = "رقم الهاتف غير صحيح";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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

  // --- شاشة النجاح (Thank You Page) ---
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6" dir="rtl">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle size={48} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">تم استلام طلبك بنجاح!</h1>
          <p className="text-gray-500 mb-8">رقم الطلب: <span className="font-mono font-bold text-black text-lg">#{orderNum}</span></p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-600 border border-gray-100">
            تم إرسال تفاصيل الفاتورة إلى <span className="font-bold text-black">{formData.email}</span>. سنقوم بالتواصل معك عبر الهاتف لتأكيد موعد التسليم.
          </div>

          <Link href="/" className="block w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition transform active:scale-95">
            متابعة التسوق
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
        <p className="text-gray-500 mb-8">يبدو أنك لم تضف أي منتجات بعد.</p>
        <Link href="/" className="bg-[#F5C518] text-black px-10 py-3 rounded-xl font-bold hover:bg-[#e0b116] transition">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  // --- صفحة الدفع الرئيسية ---
  return (
    <div className="min-h-screen bg-white text-right font-sans" dir="rtl">
      <div className="lg:grid lg:grid-cols-12 min-h-screen">
        
        {/* القسم الأيمن (النموذج) - يأخذ 7 أعمدة */}
        <div className="lg:col-span-7 px-4 py-8 lg:px-12 lg:py-12 xl:px-24">
          {/* الهيدر المبسط */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="text-3xl font-black tracking-tighter italic">WIND</Link>
            <Link href="/cart" className="text-sm font-medium text-blue-600 hover:underline lg:hidden">عرض السلة</Link>
          </div>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/cart" className="hover:text-black transition">السلة</Link>
            <ChevronRight size={14} />
            <span className="text-black font-bold">الشحن والدفع</span>
          </nav>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* معلومات الاتصال */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">معلومات الاتصال</h2>
                {!formData.email && <span className="text-xs text-red-500">{errors.email}</span>}
              </div>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition" size={18} />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-50 border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl py-3.5 pr-11 pl-4 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition`}
                  placeholder="البريد الإلكتروني"
                />
              </div>
            </section>

            {/* عنوان الشحن */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold mb-4">عنوان الشحن</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition" size={18} />
                  <input type="text" name="firstName" placeholder="الاسم الأول" onChange={handleInputChange} className={`w-full bg-gray-50 border ${errors.firstName ? 'border-red-500' : 'border-gray-200'} rounded-xl py-3.5 pr-11 pl-4 outline-none focus:bg-white focus:border-black transition`} />
                </div>
                <div className="relative group">
                   <input type="text" name="lastName" placeholder="اسم العائلة" onChange={handleInputChange} className={`w-full bg-gray-50 border ${errors.lastName ? 'border-red-500' : 'border-gray-200'} rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-black transition`} />
                </div>
              </div>

              <div className="relative group">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition" size={18} />
                <input type="text" name="address" placeholder="العنوان (الحي، اسم الشارع، رقم المنزل)" onChange={handleInputChange} className={`w-full bg-gray-50 border ${errors.address ? 'border-red-500' : 'border-gray-200'} rounded-xl py-3.5 pr-11 pl-4 outline-none focus:bg-white focus:border-black transition`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="city" placeholder="المدينة" onChange={handleInputChange} className={`w-full bg-gray-50 border ${errors.city ? 'border-red-500' : 'border-gray-200'} rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-black transition`} />
                
                <div className="relative">
                  <select name="governorate" onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 outline-none focus:bg-white focus:border-black appearance-none cursor-pointer">
                    {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                  </select>
                  <ChevronRight className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                </div>
              </div>

              <div className="relative group">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition" size={18} />
                <input type="tel" name="phone" placeholder="رقم الهاتف" onChange={handleInputChange} className={`w-full bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl py-3.5 pr-11 pl-4 outline-none focus:bg-white focus:border-black transition`} />
              </div>
            </section>

            {/* طريقة الدفع */}
            <section>
              <h2 className="text-lg font-bold mb-4">طريقة الدفع</h2>
              <div className="border border-[#F5C518] bg-[#FFFdf5] p-5 rounded-xl flex items-center justify-between cursor-pointer ring-1 ring-[#F5C518]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-[5px] border-black"></div>
                  <div>
                    <span className="block font-bold text-gray-900">الدفع عند الاستلام (COD)</span>
                    <span className="text-xs text-gray-500">ادفع نقداً عند استلام طلبك</span>
                  </div>
                </div>
                <CreditCard className="text-gray-400" size={24} />
              </div>
            </section>

            {/* زر الإرسال */}
            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-5 rounded-xl text-lg hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                   <>جاري المعالجة...</>
                ) : (
                   <>
                     <span>تأكيد الطلب ({total} EGP)</span>
                     <Lock size={16} className="opacity-70" />
                   </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock size={10} /> بياناتك مشفرة وآمنة 100%
              </p>
            </div>
          </form>
        </div>

        {/* القسم الأيسر (ملخص الطلب) - يأخذ 5 أعمدة */}
        <div className="lg:col-span-5 bg-gray-50 p-4 py-8 lg:px-10 lg:py-12 border-r border-gray-100 hidden lg:block h-screen sticky top-0 overflow-y-auto">
          <h2 className="text-xl font-black mb-6">ملخص الطلب</h2>
          
          <div className="space-y-6 mb-8">
            {cartItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="relative w-20 h-24 border border-gray-200 rounded-lg overflow-hidden bg-white shrink-0">
                  <img src={`/images/products/${item.folderName}/${item.mainImage}`} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg font-bold">{item.qty}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">المقاس: {item.selectedSize}</p>
                </div>
                <div className="font-bold text-sm">{item.price} ج.م</div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{subtotal} ج.م</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>الشحن</span>
              <span>{shipping === 0 ? 'مجاني' : `${shipping} ج.م`}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-between items-end">
              <span className="font-bold text-lg text-gray-900">الإجمالي</span>
              <div className="text-right">
                <span className="text-xs text-gray-500 block mb-1">شاملاً الضريبة</span>
                <span className="text-2xl font-black tracking-tight">{total} <span className="text-sm font-bold">ج.م</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* ملخص الطلب للموبايل (يظهر في الأسفل أو كـ Accordion إذا أردت، حالياً تركته بسيط) */}
        <div className="lg:hidden bg-gray-50 p-6 border-t border-gray-200">
           <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-700">الإجمالي المستحق</span>
              <span className="text-xl font-black">{total} ج.م</span>
           </div>
           <div className="flex -space-x-2 overflow-hidden mb-2 px-2" dir="ltr">
             {cartItems.slice(0,4).map((item,i) => (
                <img key={i} src={`/images/products/${item.folderName}/${item.mainImage}`} className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover" alt=""/>
             ))}
           </div>
           <p className="text-xs text-gray-500 mt-2">يشمل {cartItems.length} منتجات ورسوم الشحن</p>
        </div>

      </div>
    </div>
  );
}