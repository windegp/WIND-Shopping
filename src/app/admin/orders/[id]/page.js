"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowRight, Package, User, MapPin, Printer } from "lucide-react";

export default function OrderDetailsPage() {
  const { id } = useParams(); // بياخد رقم الأوردر من الرابط
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (id) fetchOrder(); 
  }, [id]);

  const fetchOrder = async () => {
    try {
      // 🔥 تنظيف رقم الأوردر وإضافة الشباك عشان الفايربيس يفهمه
      const decodedId = decodeURIComponent(id).trim();
      const orderIdWithHash = decodedId.startsWith('#') ? decodedId : `#${decodedId}`;
      
      const docSnap = await getDoc(doc(db, "Orders", orderIdWithHash));
      
      if (docSnap.exists()) {
        setOrder(docSnap.data());
      } else {
        console.error("الأوردر غير موجود في قاعدة البيانات:", orderIdWithHash);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center flex-col gap-4">
      <div className="w-10 h-10 border-4 border-[#008060] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-gray-500">جاري تحميل الفاتورة...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center gap-4">
      <p className="p-10 text-center text-red-500 font-bold text-xl">عذراً، الطلب غير موجود.</p>
      <button onClick={() => router.back()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold">العودة للطلبات</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* هيدر الفاتورة */}
        <div className="p-6 sm:p-8 border-b flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-4">
             <button onClick={()=>router.back()} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
               <ArrowRight size={20}/>
             </button>
             <div>
               <h1 className="text-xl sm:text-2xl font-black">طلب رقم {order.Name}</h1>
               <p className="text-xs text-gray-400 mt-1">التاريخ: {order['Created at']}</p>
             </div>
          </div>
          <button onClick={() => window.print()} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all">
            <Printer size={20}/>
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
           
           {/* بيانات العميل والشحن */}
           <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/> بيانات العميل</h3>
              <p className="text-sm font-bold">{order['Billing Name'] || order['Shipping Name']}</p>
              <p className="text-xs text-gray-500 mb-4">{order.Email}</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-6">
                <p className="text-[10px] text-gray-400 font-bold mb-2 flex items-center gap-1"><MapPin size={12}/> عنوان الشحن</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {order['Shipping Address1'] && <>{order['Shipping Address1']}<br/></>}
                  {order['Shipping City'] && <>{order['Shipping City']} - </>}
                  {order['Shipping Province']}<br/>
                  <span className="font-bold mt-2 inline-block">الهاتف: <span dir="ltr">{order['Shipping Phone'] || order.Phone || '---'}</span></span>
                </p>
              </div>
           </div>

           {/* تفاصيل المنتجات والحساب */}
           <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={14}/> تفاصيل المنتجات</h3>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <p className="text-xs font-bold flex-1 text-[#005bd3] pr-2">{order['Lineitem name']}</p>
                <p className="text-xs font-black shrink-0">{order['Lineitem quantity']} x {order['Lineitem price']} EGP</p>
              </div>
              
              <div className="mt-6 space-y-3">
                 <div className="flex justify-between text-xs text-gray-500">
                   <span>المبلغ الفرعي:</span>
                   <span>{order.Subtotal} EGP</span>
                 </div>
                 {order.Shipping > 0 && (
                   <div className="flex justify-between text-xs text-gray-500">
                     <span>مصاريف الشحن:</span>
                     <span>{order.Shipping} EGP</span>
                   </div>
                 )}
                 {order['Discount Amount'] > 0 && (
                   <div className="flex justify-between text-xs text-red-500">
                     <span>خصم ({order['Discount Code']}):</span>
                     <span>- {order['Discount Amount']} EGP</span>
                   </div>
                 )}
                 <div className="flex justify-between text-sm font-black pt-4 border-t border-gray-200 text-[#008060]">
                   <span>الإجمالي:</span>
                   <span>{order.Total} EGP</span>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}