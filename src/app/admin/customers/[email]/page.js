"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
// 🔥 تم إضافة أيقونة Users هنا عشان الإيرور ميظهرش تاني
import { ArrowRight, Mail, Phone, MapPin, CreditCard, Package, ShoppingBag, ChevronLeft, Users } from "lucide-react";

export default function CustomerDetailsPage() {
  const { email } = useParams(); // email هنا بيشيل الإيميل أو الـ ID
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => { if (email) fetchAllData(); }, [email]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const decodedParam = decodeURIComponent(email).trim();
      let cData = null;

      // بندور بالـ ID المباشر
      const cSnap = await getDoc(doc(db, "Customers", decodedParam));
      if (cSnap.exists()) { 
        cData = cSnap.data(); 
      } else {
        // ولو كان إيميل بندور بيه كإجراء احتياطي
        const fallbackQ = query(collection(db, "Customers"), where("Email", "==", decodedParam));
        const fallSnap = await getDocs(fallbackQ);
        if (!fallSnap.empty) cData = fallSnap.docs[0].data();
      }
      
      if (cData) {
        setCustomer(cData);
        
        // جلب الأوردرات (لو معندوش إيميل هيدور بالاسم كبديل)
        let q;
        if (cData.Email) {
          q = query(collection(db, "Orders"), where("Email", "==", cData.Email));
        } else {
          q = query(collection(db, "Orders"), where("Billing Name", "==", `${cData['First Name']} ${cData['Last Name']}`));
        }
        
        const oSnap = await getDocs(q);
        const oList = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const oWithImg = await Promise.all(oList.map(async (order) => {
          const pQ = query(collection(db, "products"), where("title", "==", order['Lineitem name']));
          const pSnap = await getDocs(pQ);
          return { ...order, productImage: !pSnap.empty ? pSnap.docs[0].data().images?.[0] : null };
        }));
        setOrders(oWithImg);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-[#008060]">جاري تحميل ملف العميل...</div>;
  if (!customer) return <div className="p-20 text-center text-red-500 font-bold">العميل غير موجود في قاعدة البيانات.<br/><br/><button onClick={()=>router.back()} className="px-4 py-2 bg-white border rounded-lg text-black">العودة</button></div>;

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#008060] transition-colors group"><div className="p-2 bg-white rounded-lg border group-hover:border-[#008060]"><ArrowRight size={16}/></div> العودة لقائمة العملاء</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* كارت بيانات العميل */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#008060]"><Users size={40} /></div>
              <h2 className="text-2xl font-black">{customer['First Name']} {customer['Last Name']}</h2>
              <p className="text-xs text-gray-400 font-mono mt-1">{customer.Email || 'العميل لم يسجل بريد إلكتروني'}</p>
              
              <div className="space-y-6 pt-6 mt-6 border-t border-gray-100 text-right">
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Phone size={18}/></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">رقم الهاتف</p>
                    <p className="text-sm font-black tracking-widest" dir="ltr">{customer.Phone || customer['Default Address Phone'] || 'غير متوفر'}</p>
                  </div>
                </div>

                {/* 🔥 التعديل هنا: إضافة العنوان التفصيلي اللي إنت طلبته */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><MapPin size={18}/></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">العنوان التفصيلي</p>
                    <p className="text-xs font-bold leading-relaxed text-gray-800">
                      {customer['Default Address Address1'] || 'لم يتم تسجيل عنوان تفصيلي'}
                      {customer['Default Address City'] && <span className="block mt-1 text-[10px] text-gray-500">{customer['Default Address City']}</span>}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center"><p className="text-[10px] text-gray-400 font-bold mb-2">عدد الطلبات</p><p className="text-2xl font-black">{customer['Total Orders'] || 0}</p></div>
               <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center"><p className="text-[10px] text-gray-400 font-bold mb-2">إجمالي الصرف</p><p className="text-xl font-black text-[#008060]">{customer['Total Spent'] || 0} ج</p></div>
            </div>
          </div>

          {/* سجل المشتريات */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center"><h3 className="font-black flex items-center gap-2"><ShoppingBag size={20} className="text-[#008060]"/> سجل المشتريات</h3><span className="text-xs font-bold text-gray-400">({orders.length}) طلب</span></div>
             <div className="divide-y divide-gray-50">
                {orders.length > 0 ? orders.map((o) => (
                  <div key={o.id} className="p-5 flex items-center gap-5 hover:bg-gray-50 cursor-pointer group transition-all" 
                       onClick={() => router.push(`/admin/orders/${encodeURIComponent(o.Name.replace('#', ''))}`)}>
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden shadow-sm">{o.productImage ? <img src={o.productImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24}/></div>}</div>
                    <div className="flex-1"><p className="text-sm font-black text-[#005bd3] group-hover:underline">#{o.Name.replace('#', '')}</p><p className="text-[11px] text-gray-500 mt-1 font-bold line-clamp-1">{o['Lineitem name']}</p></div>
                    <div className="text-left shrink-0"><p className="text-md font-black">{o.Total} EGP</p><p className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 mt-1 uppercase text-center">{o['Financial Status']}</p></div>
                  </div>
                )) : <div className="p-24 text-center text-gray-400 flex flex-col items-center gap-3"><Package size={40} className="opacity-20"/><p className="font-bold text-sm">لا توجد طلبات مرتبطة بهذا العميل</p></div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}