"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ArrowRight, Mail, Phone, MapPin, CreditCard, Package, ShoppingBag, ChevronLeft } from "lucide-react";

export default function CustomerDetailsPage() {
  const { email } = useParams();
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

      // البحث عن العميل بأي طريقة
      const cSnap = await getDoc(doc(db, "Customers", decodedParam));
      if (cSnap.exists()) { cData = cSnap.data(); } 
      else {
        const fallbackQ = query(collection(db, "Customers"), where("Email", "==", decodedParam));
        const fallSnap = await getDocs(fallbackQ);
        if (!fallSnap.empty) cData = fallSnap.docs[0].data();
      }
      
      if (cData) {
        setCustomer(cData);
        // الأوردرات
        const q = query(collection(db, "Orders"), where("Email", "==", cData.Email || decodedParam));
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

  if (loading) return <div className="p-20 text-center animate-pulse">جاري التحميل...</div>;
  if (!customer) return <div className="p-20 text-center text-red-500 font-bold">العميل غير موجود. <button onClick={()=>router.back()} className="text-blue-500 underline">العودة</button></div>;

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#008060]"><div className="p-2 bg-white rounded-lg border"><ArrowRight size={16}/></div> العودة لقائمة العملاء</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* كارت العميل */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#008060]"><Users size={40} /></div>
              <h2 className="text-2xl font-black">{customer['First Name']} {customer['Last Name']}</h2>
              <p className="text-xs text-gray-400 mt-1">{customer.Email || 'بدون إيميل'}</p>
              <div className="space-y-4 pt-6 mt-6 border-t text-right">
                <div className="flex gap-4"><div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Phone size={18}/></div><div><p className="text-[10px] text-gray-400">رقم الهاتف</p><p className="text-sm font-black">{customer.Phone || '---'}</p></div></div>
                <div className="flex gap-4"><div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><MapPin size={18}/></div><div><p className="text-[10px] text-gray-400">الموقع</p><p className="text-sm font-bold">{customer['Default Address City'] || '---'}</p></div></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl border text-center"><p className="text-[10px] text-gray-400 mb-2">عدد الطلبات</p><p className="text-2xl font-black">{customer['Total Orders'] || 0}</p></div>
               <div className="bg-white p-6 rounded-3xl border text-center"><p className="text-[10px] text-gray-400 mb-2">إجمالي الصرف</p><p className="text-xl font-black text-[#008060]">{customer['Total Spent'] || 0} ج</p></div>
            </div>
          </div>

          {/* الطلبات */}
          <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm">
             <div className="p-6 border-b bg-gray-50/30 flex justify-between items-center"><h3 className="font-black flex items-center gap-2"><ShoppingBag size={20} className="text-[#008060]"/> سجل المشتريات</h3></div>
             <div className="divide-y">
                {orders.length > 0 ? orders.map((o) => (
                  <div key={o.id} className="p-5 flex items-center gap-5 hover:bg-gray-50 cursor-pointer group" 
                       // 🔥 الحل الجذري للـ 404: بنشيل علامة الـ # من الرابط خالص
                       onClick={() => router.push(`/admin/orders/${o.Name.replace('#', '')}`)}>
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border shrink-0">{o.productImage ? <img src={o.productImage} className="w-full h-full object-cover rounded-2xl" /> : <div className="w-full h-full flex items-center justify-center"><Package size={24}/></div>}</div>
                    <div className="flex-1"><p className="text-sm font-black text-[#005bd3]">#{o.Name.replace('#', '')}</p><p className="text-[11px] text-gray-500 mt-1">{o['Lineitem name']}</p></div>
                    <div className="text-left shrink-0"><p className="text-md font-black">{o.Total} EGP</p><p className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 mt-1">{o['Financial Status']}</p></div>
                  </div>
                )) : <div className="p-20 text-center text-gray-400">لا توجد طلبات.</div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}