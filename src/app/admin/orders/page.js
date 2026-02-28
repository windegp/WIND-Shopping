"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Search, Filter, Calendar, 
  ChevronLeft, CreditCard, Truck, MoreHorizontal 
} from "lucide-react";

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // جلب آخر 100 أوردر كمثال للسرعة، ومرتبين بالأحدث
      const q = query(collection(db, "Orders"), orderBy("Created at", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(docs);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // دالة لتلوين حالة الدفع (Financial Status)
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'refunded': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* الهيدر */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShoppingBag className="text-[#008060]" /> جميع الطلبات
          </h1>
          <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            إجمالي السجلات: 993 أوردر
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* بار البحث والفلترة */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="ابحث برقم الطلب (#1001) أو إيميل العميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#008060]"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50">
              <Filter size={16} /> فلاتر متقدمة
            </button>
          </div>

          {/* الجدول الرئيسي */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">الطلب</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">حالة الدفع</th>
                  <th className="px-6 py-4">التوصيل</th>
                  <th className="px-6 py-4">الإجمالي</th>
                  <th className="px-6 py-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-20 text-gray-400 animate-pulse font-bold italic">جاري تحميل أوردرات WIND...</td></tr>
                ) : (
                  orders.filter(o => 
                    o.Name?.toLowerCase().includes(search.toLowerCase()) || 
                    o.Email?.toLowerCase().includes(search.toLowerCase())
                  ).map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 transition-all cursor-pointer group"
                      onClick={() => router.push(`/admin/orders/${order.Name}`)}
                    >
                      <td className="px-6 py-4 text-sm font-black text-[#005bd3]">
                        {order.Name}
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-500">
                        {order['Created at']?.split(' ')[0]}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{order['Billing Name'] || 'عميل مجهول'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{order.Email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order['Financial Status'])}`}>
                          {order['Financial Status'] === 'paid' ? 'مدفوع' : 'معلق'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Truck size={12} className="text-gray-400" />
                          {order['Fulfillment Status'] || 'unfulfilled'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900">
                        {order.Total} <span className="text-[10px] text-gray-400 font-normal">{order.Currency}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ChevronLeft size={16} className="text-gray-300 group-hover:text-[#008060] transition-colors inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ترقيم الصفحات (Pagination) - بسيط حالياً */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-bold">
            <p>عرض {orders.length} من أصل 993 طلب</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100">السابق</button>
              <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100">التالي</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}