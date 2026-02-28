"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  ArrowRight, Mail, Phone, MapPin, CreditCard, 
  Package, Calendar, Tag, Info, ExternalLink, 
  User, ShieldCheck, ShoppingBag
} from "lucide-react";

export default function CustomerDetailsPage() {
  const { email } = useParams(); // بناخد الإيميل من الرابط
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerOrders, setCustomerOrders] = useState([]); // جاهزة لخطوة الأوردرات

  useEffect(() => {
    if (email) {
      fetchCustomerData();
    }
  }, [email]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // 1. جلب بيانات العميل (فك شفيرة الإيميل لو فيه رموز)
      const decodedEmail = decodeURIComponent(email);
      const docRef = doc(db, "Customers", decodedEmail);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCustomer(docSnap.data());
        
        // 2. تهيئة جلب الأوردرات (الربط اللي سألت عليه)
        // بنجهز الكود عشان يدور في درج "Orders" عن أي أوردر فيه نفس الإيميل
        const ordersQ = query(collection(db, "Orders"), where("Email", "==", decodedEmail));
        const ordersSnap = await getDocs(ordersQ);
        setCustomerOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center text-[#008060] font-bold animate-pulse">جاري تحميل ملف العميل...</div>;
  if (!customer) return <div className="p-10 text-center">العميل غير موجود!</div>;

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* هيدر الصفحة */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black">{customer['First Name']} {customer['Last Name']}</h1>
            <p className="text-xs text-gray-500 font-mono">{customer.Email}</p>
          </div>
          {customer.Tags && (
            <div className="mr-auto flex gap-2">
              <span className="bg-[#008060]/10 text-[#008060] px-3 py-1 rounded-full text-[10px] font-bold border border-[#008060]/20">
                {customer.Tags}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* العمود الأيمن: البطاقات السريعة والبيانات الشخصية */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* كارت الحالة المالية */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#008060]"></div>
              <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">ملخص النشاط</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400">إجمالي الإنفاق</p>
                    <p className="text-xl font-black text-[#008060]">{customer['Total Spent'] || 0} EGP</p>
                  </div>
                  <CreditCard size={24} className="text-gray-100" />
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400">عدد الطلبات</p>
                    <p className="text-lg font-black">{customer['Total Orders'] || 0}</p>
                  </div>
                  <Package size={24} className="text-gray-100" />
                </div>
              </div>
            </div>

            {/* كارت التواصل */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 mb-4">بيانات التواصل</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><Mail size={16}/></div>
                  <p className="text-sm font-bold truncate">{customer.Email}</p>
                </div>
                {customer.Phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><Phone size={16}/></div>
                    <p className="text-sm font-bold" dir="ltr">{customer.Phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* كارت الشرائح (Segments) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 mb-4">الشرائح (Segments)</h3>
              <div className="flex flex-wrap gap-2">
                {customer.segments?.map(seg => (
                  <span key={seg} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold">
                    #{seg.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* العمود الأوسط/الأيسر: العناوين والأوردرات */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* كارت العنوان الافتراضي */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-[#008060]" />
                <h3 className="text-sm font-bold">العنوان المفضل للشحن</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">المحافظة / المدينة</p>
                  <p className="text-sm font-bold">{customer['Default Address City'] || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">الرمز البريدي</p>
                  <p className="text-sm font-bold">{customer['Default Address Zip'] || '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 mb-1">العنوان بالتفصيل</p>
                  <p className="text-sm font-bold">{customer['Default Address Address1']} {customer['Default Address Address2']}</p>
                </div>
              </div>
            </div>

            {/* 🔥 قسم الأوردرات (مهيء للربط الكامل) 🔥 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#008060]" />
                  <h3 className="text-sm font-bold">سجل الطلبات</h3>
                </div>
                <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                  {customerOrders.length} طلب
                </span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {customerOrders.length > 0 ? customerOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer group"
                       onClick={() => router.push(`/admin/orders/${order.Name}`)}>
                    <div>
                      <p className="text-sm font-black text-[#005bd3]">#{order.Name}</p>
                      <p className="text-[10px] text-gray-400">{order['Created at']}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">{order.Total} EGP</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${order['Financial Status'] === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {order['Financial Status']}
                      </span>
                    </div>
                    <ChevronLeft size={16} className="text-gray-300 mr-2 group-hover:text-[#008060] transition-colors" />
                  </div>
                )) : (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <Package className="text-gray-200" size={40} />
                    <p className="text-xs text-gray-400">لا توجد طلبات مسجلة لهذا العميل حتى الآن</p>
                  </div>
                )}
              </div>

              {customerOrders.length > 0 && (
                <div className="p-4 bg-gray-50 text-center">
                  <button className="text-[11px] font-bold text-[#005bd3] hover:underline flex items-center justify-center gap-1 mx-auto">
                    عرض كل أوردرات العميل في صفحة الطلبات <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}