"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  ArrowRight, Mail, Phone, MapPin, CreditCard, 
  Package, ShoppingBag, ChevronLeft, ExternalLink, Info
} from "lucide-react";

export default function CustomerDetailsPage() {
  const { email } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (email) fetchAllData();
  }, [email]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const decodedEmail = decodeURIComponent(email);
      // 1. جلب بيانات العميل الأساسية من الفايربيس
      const cSnap = await getDoc(doc(db, "Customers", decodedEmail));
      
      if (cSnap.exists()) {
        const cData = cSnap.data();
        setCustomer(cData);

        // 2. جلب كل الأوردرات المرتبطة بهذا الإيميل
        const q = query(collection(db, "Orders"), where("Email", "==", decodedEmail));
        const oSnap = await getDocs(q);
        const oList = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 🔥 الربط بصورة المنتج من درج (products) بناءً على اسم المنتج المكتوب في الأوردر
        const ordersWithRealImages = await Promise.all(oList.map(async (order) => {
          // هندور في المنتجات على منتج عنوانه يطابق 'Lineitem name' اللي في شيت الأوردرات
          const pQuery = query(collection(db, "products"), where("title", "==", order['Lineitem name']));
          const pSnap = await getDocs(pQuery);
          
          let productImage = null;
          if (!pSnap.empty) {
            productImage = pSnap.docs[0].data().images?.[0]; // لو لقى المنتج هيجيب أول صورة له
          }
          return { ...order, productImage };
        }));

        setOrders(ordersWithRealImages);
      }
    } catch (err) { 
      console.error("Error fetching data:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center flex-col gap-4">
      <div className="w-10 h-10 border-4 border-[#008060] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-gray-500">جاري سحب ملفات العميل من WIND...</p>
    </div>
  );

  if (!customer) return <div className="p-20 text-center font-bold text-red-500">العميل غير موجود في قاعدة البيانات.</div>;

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* هيدر الصفحة والرجوع */}
        <button 
          onClick={() => router.back()} 
          className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#008060] transition-colors group"
        >
          <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-[#008060]">
            <ArrowRight size={16}/>
          </div>
          العودة لقائمة العملاء
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* العمود الأيمن: كارت العميل التعريفي */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-[#008060]">
                  <Users size={40} />
                </div>
                <h2 className="text-2xl font-black">{customer['First Name']} {customer['Last Name']}</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">{customer.Email}</p>
              </div>
              
              <div className="space-y-5 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Phone size={18}/></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">رقم الهاتف</p>
                    <p className="text-sm font-black tracking-widest" dir="ltr">{customer.Phone || '---'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><MapPin size={18}/></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">الموقع</p>
                    <p className="text-sm font-bold">{customer['Default Address City'] || '---'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center">
                  <p className="text-[10px] text-gray-400 font-bold mb-2">عدد الطلبات</p>
                  <p className="text-2xl font-black text-[#202223]">{customer['Total Orders'] || 0}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center">
                  <p className="text-[10px] text-gray-400 font-bold mb-2">إجمالي الصرف</p>
                  <p className="text-xl font-black text-[#008060]">{customer['Total Spent'] || 0} ج.م</p>
               </div>
            </div>
          </div>

          {/* العمود الأيسر: سجل الطلبات المتصل بصور منتجاتك */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h3 className="text-md font-black flex items-center gap-2">
                  <ShoppingBag size={20} className="text-[#008060]"/> سجل المشتريات
                </h3>
                <span className="text-xs font-black text-gray-400">({orders.length}) طلب مسجل</span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {orders.length > 0 ? orders.map((o) => (
                  <div 
                    key={o.id} 
                    className="p-5 flex items-center gap-5 hover:bg-gray-50 transition-all cursor-pointer group"
                    onClick={() => router.push(`/admin/orders/${encodeURIComponent(o.Name)}`)}
                  >
                    {/* صورة المنتج المسحوبة من درج products */}
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                       {o.productImage ? (
                         <img src={o.productImage} className="w-full h-full object-cover" alt={o['Lineitem name']} />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                           <Package size={24}/>
                         </div>
                       )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-black text-[#005bd3] group-hover:underline">#{o.Name}</p>
                      <p className="text-[11px] text-gray-500 font-bold mt-0.5 line-clamp-1">{o['Lineitem name']}</p>
                      <p className="text-[9px] text-gray-400 mt-1">{o['Created at']}</p>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="text-md font-black text-gray-900">{o.Total} EGP</p>
                      <div className="mt-1 flex gap-1 justify-end">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${o['Financial Status'] === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {o['Financial Status']}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft size={18} className="text-gray-300 group-hover:text-[#008060] transition-colors" />
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-4">
                    <Package size={60} className="opacity-10" />
                    <p className="text-sm font-bold">لا توجد طلبات مرتبطة بهذا العميل حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}