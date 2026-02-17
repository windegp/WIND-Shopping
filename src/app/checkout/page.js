"use client";

import React, { useState } from 'react';
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { ChevronDown, Info, CheckCircle2, Phone, ShoppingBag, Shield, Tag, ChevronLeft, Truck, CreditCard, Banknote, Smartphone } from 'lucide-react';

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "القليوبية", "الشرقية", "المنوفية", "الغربية", "البحيرة", "دمياط", "بورسعيد", "السويس", "الإسماعيلية", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

const InputField = ({ label, error, children }) => (
  <div className="relative">
    {children}
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <span>⚠</span> هذا الحقل مطلوب
      </p>
    )}
  </div>
);

export default function CheckoutPage() {
  const { cartItems, clearCart, subtotal } = useCart();
  const SHIPPING_COST = 70;
  const finalTotal = subtotal + SHIPPING_COST;

  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [discountCode, setDiscountCode] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: false });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return window.scrollTo(0, 0);
  setLoading(true);

  const orderId = `WIND-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    if (paymentMethod === 'card') {
      // ← طلب رابط الدفع من كاشير
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: finalTotal.toFixed(2),
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || 'حدث خطأ، حاول مرة أخرى');
      }

      // ← تحويل العميل لصفحة كاشير
      window.location.href = data.paymentUrl;

    } else {
      // ← COD أو InstaPay
      setTimeout(() => {
        setOrderCompleted(true);
        clearCart();
        setLoading(false);
      }, 2000);
    }

  } catch (err) {
    alert(err.message);
    setLoading(false);
  }
};

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap'); * { font-family: 'Cairo', sans-serif; }`}</style>
        <div className="bg-[#1A1A1A] rounded-3xl border border-[#333] p-12 max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-[#F5C518]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 size={44} className="text-[#F5C518]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">تم استلام طلبك بنجاح</h1>
          <p className="text-gray-400 mb-2 leading-relaxed">شكراً لثقتك بنا. سنتواصل معك هاتفياً في أقرب وقت لتأكيد الشحن.</p>
          <p className="text-xs text-gray-500 mb-8">مدة التوصيل المتوقعة: ٣ - ٥ أيام عمل</p>
          <Link href="/" className="block bg-[#F5C518] text-black px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = (field) =>
    `w-full p-3.5 border rounded-xl outline-none transition-all text-sm bg-white placeholder-gray-400 focus:ring-2 focus:ring-[#F5C518] focus:border-transparent ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap');
        * { font-family: 'Cairo', sans-serif; }
        .step-badge { background: #F5C518; color: black; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; flex-shrink: 0; }
        .payment-option { transition: all 0.2s ease; }
        .payment-option:hover { background-color: #fdfcf6; }
        .payment-option.active { background-color: #fdfcf6; border-color: #F5C518 !important; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .slide-down { animation: slideDown 0.25s ease forwards; }
        select { background-image: none !important; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm">
            <ChevronLeft size={16} />
            <span>العودة للمتجر</span>
          </Link>
          <div className="flex items-center gap-2">
             {/* تم حذف كلمة ويند والايقونة بناء على الطلب */}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
            <Shield size={14} className="text-[#F5C518]" />
            <span>دفع آمن</span>
          </div>
        </div>
      </header>

      {/* Mobile: Order Summary Toggle */}
      <div className="lg:hidden bg-black text-white px-6 py-3 cursor-pointer" onClick={() => setSummaryOpen(!summaryOpen)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag size={16} className="text-[#F5C518]" />
            <span>{summaryOpen ? 'إخفاء تفاصيل الطلب' : 'عرض تفاصيل الطلب'}</span>
            <ChevronDown size={16} className={`transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className="font-black text-lg text-[#F5C518]">ج.م {finalTotal}.00</span>
        </div>
        {summaryOpen && (
          <div className="mt-4 pb-2 slide-down space-y-3">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-white/20 rounded-lg overflow-hidden shrink-0">
                  <img src={item.image || item.images?.[0] || 'https://placehold.co/100'} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#F5C518] text-black text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{item.qty}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-xs opacity-75">{item.selectedSize}</p>
                </div>
                <span className="text-sm font-bold text-[#F5C518]">ج.م {item.price * item.qty}.00</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 space-y-1 text-sm">
              <div className="flex justify-between opacity-80"><span>المجموع الفرعي</span><span>ج.م {subtotal}.00</span></div>
              <div className="flex justify-between opacity-80"><span>الشحن</span><span>ج.م {SHIPPING_COST}.00</span></div>
              <div className="flex justify-between font-black text-base pt-1 text-[#F5C518]"><span>الإجمالي</span><span>ج.م {finalTotal}.00</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row">

        {/* ======= Right: Form ======= */}
        <div className="w-full lg:w-[58%] p-6 lg:p-10 order-2 lg:order-1">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* STEP 1: Contact */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="step-badge">١</div>
                <h2 className="text-lg font-bold text-gray-900">معلومات التواصل</h2>
              </div>
              <div className="space-y-3">
                <InputField error={errors.email}>
                  <input
                    type="email" name="email" placeholder="البريد الإلكتروني"
                    value={formData.email} onChange={handleInputChange}
                    className={inputClass('email')}
                  />
                </InputField>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#F5C518] rounded" />
                  <span className="text-xs text-gray-500">أرسل لي أحدث العروض والمنتجات الجديدة</span>
                </label>
              </div>
            </section>

            {/* STEP 2: Delivery */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="step-badge">٢</div>
                <h2 className="text-lg font-bold text-gray-900">عنوان التوصيل</h2>
              </div>
              <div className="space-y-3">
                <select className={inputClass('')} disabled>
                  <option>مصر</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <InputField error={errors.firstName}>
                    <input type="text" name="firstName" placeholder="الاسم الأول" value={formData.firstName} onChange={handleInputChange} className={inputClass('firstName')} />
                  </InputField>
                  <InputField error={errors.lastName}>
                    <input type="text" name="lastName" placeholder="اسم العائلة" value={formData.lastName} onChange={handleInputChange} className={inputClass('lastName')} />
                  </InputField>
                </div>

                <InputField error={errors.address}>
                  <input type="text" name="address" placeholder="العنوان بالتفصيل (الشارع، رقم المبنى)" value={formData.address} onChange={handleInputChange} className={inputClass('address')} />
                </InputField>

                <input type="text" name="landmark" placeholder="علامة مميزة للموقع (اختياري)" value={formData.landmark} onChange={handleInputChange} className={inputClass('')} />

                <div className="grid grid-cols-2 gap-3">
                  <InputField error={errors.city}>
                    <input type="text" name="city" placeholder="المدينة" value={formData.city} onChange={handleInputChange} className={inputClass('city')} />
                  </InputField>
                  <div className="relative">
                    <select name="governorate" value={formData.governorate} onChange={handleInputChange} className={inputClass('') + ' appearance-none pr-3 pl-8'}>
                      {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="postalCode" placeholder="الرمز البريدي (اختياري)" value={formData.postalCode} onChange={handleInputChange} className={inputClass('')} />
                  <InputField error={errors.phone}>
                    <div className="relative">
                      <input type="tel" name="phone" placeholder="رقم الهاتف" value={formData.phone} onChange={handleInputChange} className={inputClass('phone') + ' pl-10'} />
                      <Info size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </InputField>
                </div>

                <input type="tel" name="altPhone" placeholder="رقم هاتف بديل (اختياري)" value={formData.altPhone} onChange={handleInputChange} className={inputClass('')} />
              </div>
            </section>

            {/* STEP 3: Shipping Method */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="step-badge">٣</div>
                <h2 className="text-lg font-bold text-gray-900">طريقة الشحن</h2>
              </div>
              <div className="border-2 border-[#F5C518] bg-[#fdfcf6] rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Truck size={16} className="text-[#F5C518]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">شحن قياسي</p>
                    <p className="text-xs text-gray-500">٣ - ٥ أيام عمل</p>
                  </div>
                </div>
                <span className="font-black text-black text-base">ج.م {SHIPPING_COST}.00</span>
              </div>
            </section>

            {/* STEP 4: Payment */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="step-badge">٤</div>
                <h2 className="text-lg font-bold text-gray-900">طريقة الدفع</h2>
              </div>
              <p className="text-xs text-gray-400 mb-5 pr-9">جميع المعاملات مشفرة وآمنة</p>

              <div className="space-y-2">
                {/* Card */}
                <label className={`payment-option flex flex-col border-2 rounded-xl p-4 cursor-pointer ${paymentMethod === 'card' ? 'active' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 accent-[#F5C518]" />
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-700" />
                        <span className="font-semibold text-sm">كارت / محفظة إلكترونية</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="px-2 py-0.5 bg-blue-600 rounded text-white text-[9px] font-black">VISA</div>
                      <div className="px-2 py-0.5 bg-orange-500 rounded text-white text-[9px] font-black">M/C</div>
                      <div className="px-2 py-0.5 bg-green-600 rounded text-white text-[9px] font-black">كاش</div>
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 slide-down p-3 bg-gray-100 rounded-lg text-center text-xs text-gray-700 font-medium">
                      سيتم توجيهك لبوابة الدفع الآمنة لإتمام العملية
                    </div>
                  )}
                </label>

                {/* COD */}
                <label className={`payment-option flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer ${paymentMethod === 'cod' ? 'active' : 'border-gray-200'}`}>
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 accent-[#F5C518]" />
                  <Banknote size={18} className="text-gray-700" />
                  <div>
                    <p className="font-semibold text-sm">الدفع عند الاستلام</p>
                    <p className="text-xs text-gray-400">ادفع كاش لدى استلام طلبك</p>
                  </div>
                </label>

                {/* InstaPay */}
                <label className={`payment-option flex flex-col border-2 rounded-xl p-4 cursor-pointer ${paymentMethod === 'instapay' ? 'active' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={paymentMethod === 'instapay'} onChange={() => setPaymentMethod('instapay')} className="w-4 h-4 accent-[#F5C518]" />
                    <Smartphone size={18} className="text-gray-700" />
                    <div>
                      <p className="font-semibold text-sm">إنستا باي</p>
                      <p className="text-xs text-gray-400">تحويل فوري وآمن</p>
                    </div>
                  </div>
                  {paymentMethod === 'instapay' && (
                    <div className="mt-4 slide-down p-4 bg-gray-50 border border-gray-200 rounded-xl text-right">
                      <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        خطوات الدفع عبر إنستا باي
                      </p>
                      <ol className="text-xs text-gray-700 space-y-1.5 leading-relaxed list-decimal list-inside">
                        <li>افتح تطبيق إنستا باي</li>
                        <li>
                          حوّل المبلغ <strong>ج.م {finalTotal}.00</strong> للرقم:{' '}
                          <span className="font-mono font-black text-black bg-[#F5C518] px-2 py-0.5 rounded select-all">01026628476</span>
                        </li>
                        <li>أرسل صورة الإيصال على واتساب للتأكيد</li>
                      </ol>
                      <a href="https://wa.me/201026628476" target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
                        <Phone size={14} />
                        إرسال الإيصال عبر واتساب
                      </a>
                    </div>
                  )}
                </label>
              </div>
            </section>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-black text-[#F5C518] font-black py-4 rounded-xl text-base hover:bg-[#1A1A1A] active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#F5C518]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
              {paymentMethod === 'card' ? 'جارٍ التحويل لكاشير...' : 'جارٍ المعالجة...'}
                </>
              ) : paymentMethod === 'card' ? (
                <>ادفع الآن — ج.م {finalTotal}.00</>
              ) : (
                <>تأكيد الطلب — ج.م {finalTotal}.00</>
              )}
            </button>

            <div className="flex flex-wrap justify-center gap-5 pt-4 border-t border-gray-100">
              {['سياسة الاسترجاع', 'سياسة الشحن', 'سياسة الخصوصية', 'الشروط والأحكام'].map(link => (
                <Link key={link} href="#" className="text-[11px] text-gray-400 hover:text-black transition underline underline-offset-2">{link}</Link>
              ))}
            </div>
          </form>
        </div>

        {/* ======= Left: Order Summary ======= */}
        <div className="hidden lg:block w-full lg:w-[42%] bg-white border-r border-gray-200 order-1 lg:order-2">
          <div className="sticky top-[65px] p-8 lg:p-10">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#F5C518]" />
              ملخص طلبك
            </h3>

            {/* Cart Items */}
            <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                    <img src={item.image || item.images?.[0] || 'https://placehold.co/100'} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-black text-[#F5C518] text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow">{item.qty}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.title}</h4>
                    {item.selectedSize && <p className="text-xs text-gray-400 mt-0.5">المقاس: {item.selectedSize}</p>}
                  </div>
                  <span className="text-sm font-bold text-gray-800 shrink-0">ج.م {item.price * item.qty}.00</span>
                </div>
              ))}
            </div>

            {/* Discount Code */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Tag size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="كود الخصم"
                  value={discountCode} onChange={e => setDiscountCode(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#F5C518]/30 focus:border-transparent placeholder-gray-400 bg-gray-50"
                />
              </div>
              <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-semibold text-xs cursor-not-allowed" disabled>
                تطبيق
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>المجموع الفرعي</span>
                <span className="font-medium text-gray-800">ج.م {subtotal}.00</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Truck size={13} />
                  <span>رسوم الشحن</span>
                </div>
                <span className="font-medium text-gray-800">ج.م {SHIPPING_COST}.00</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">الإجمالي</span>
                <div className="text-left">
                  <p className="text-xs text-gray-400 text-left">جنيه مصري</p>
                  <p className="text-2xl font-black text-black">ج.م {finalTotal}.00</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'دفع آمن' },
                { label: 'استرجاع سهل' },
                { label: 'دعم سريع' },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                    <Shield size={16} className="text-[#F5C518]" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}