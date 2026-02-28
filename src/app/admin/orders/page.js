"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Search, Filter, Monitor, Archive, Layers,
  ChevronLeft, ChevronRight, Truck 
} from "lucide-react";

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // نظام التبويبات (Tabs) لفصل المنشأ
  const [activeTab, setActiveTab] = useState('shopify'); // 'wind', 'shopify', 'all'

  // إعدادات ترقيم الصفحات (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; 

  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  // فلترة الطلبات عند البحث أو تغيير التبويب
  useEffect(() => {
    let result = orders;

    // 1. الفلترة حسب مصدر الطلب (التبويبات)
    if (activeTab === 'shopify') {
      result = result.filter(o => o.data_source === 'Shopify_Import');
    } else if (activeTab === 'wind') {
      result = result.filter(o => o.data_source === 'WIND_Web'); 
    }

    // 2. الفلترة حسب البحث
    if (search) {
      result = result.filter(o => 
        o.Name?.toLowerCase().includes(search.toLowerCase()) || 
        o.Email?.toLowerCase().includes(search.toLowerCase()) ||
        o['Lineitem name']?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredOrders(result);
    setCurrentPage(1); // نرجع للصفحة الأولى لو غيرنا الفلتر
  }, [search, activeTab, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // بنجيب الأوردرات كلها عشان نقسمها براحتنا من غير ما نحمل صور ونتقل الصفحة
      const q = query(collection(db, "Orders"), orderBy("Created at", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(docs);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'refunded': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // حسابات الـ Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* الهيدر */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShoppingBag className="text-[#008060]" /> جميع الطلبات
          </h1>
          <span className="text-xs font-bold text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            إجمالي المعروض: <span className="text-[#008060] font-black">{filteredOrders.length}</span> طلب
          </span>
        </div>

        {/* التبويبات (Tabs) لفصل القديم عن الجديد */}
        <div className="flex gap-2 sm:gap-6 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('wind')} 
            className={`flex items-center gap-2 pb-3 px-2 font-black text-sm transition-all whitespace-nowrap ${activeTab === 'wind' ? 'border-b-2 border-[#008060] text-[#008060]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Monitor size={16}/> طلبات موقع WIND
          </button>
          <button 
            onClick={() => setActiveTab('shopify')} 
            className={`flex items-center gap-2 pb-3 px-2 font-black text-sm transition-all whitespace-nowrap ${activeTab === 'shopify' ? 'border-b-2 border-[#008060] text-[#008060]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Archive size={16}/> أرشيف شوبيفاي
          </button>
          <button 
            onClick={() => setActiveTab('all')} 
            className={`flex items-center gap-2 pb-3 px-2 font-black text-sm transition-all whitespace-nowrap ${activeTab === 'all' ? 'border-b-2 border-[#008060] text-[#008060]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Layers size={16}/> كل الطلبات
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* بار البحث */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-3.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="ابحث برقم الطلب (#1001)، الإيميل، أو اسم المنتج..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#008060] transition-all shadow-sm"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
              <Filter size={16} /> فلاتر
            </button>
          </div>

          {/* الجدول الرئيسي (بدون صور) */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-5">الطلب والتاريخ</th>
                  <th className="px-6 py-5">العميل</th>
                  <th className="px-6 py-5">المنتج والكمية</th>
                  <th className="px-6 py-5 text-center">حالة الدفع</th>
                  <th className="px-6 py-5">الإجمالي</th>
                  <th className="px-6 py-5 text-center">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-sans">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-24 text-[#008060] font-black animate-pulse">جاري تحميل سجلات WIND...</td></tr>
                ) : currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-24 text-gray-400">
                      <Archive size={40} className="mx-auto mb-3 opacity-20"/>
                      <p className="font-bold">لا توجد طلبات في هذا القسم</p>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => {
                    // تحديد عدد المنتجات (لو فيه مصفوفة lineItems بنعرض أول اسم وجنبه إشارة إن فيه كمان)
                    const hasMultiple = order.lineItems && order.lineItems.length > 1;
                    const displayProductName = order['Lineitem name'] || (order.lineItems && order.lineItems[0]?.name) || 'منتج غير محدد';
                    const displayQuantity = order['Lineitem quantity'] || (order.lineItems && order.lineItems[0]?.quantity) || 1;

                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                        onClick={() => router.push(`/admin/orders/${encodeURIComponent(order.Name)}`)}
                      >
                        {/* رقم الطلب والتاريخ */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-[#005bd3] group-hover:underline">{order.Name}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">{order['Created at']?.split(' ')[0]}</p>
                        </td>

                        {/* العميل */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{order['Billing Name'] || 'عميل مجهول'}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{order.Email}</p>
                        </td>

                        {/* المنتج والكمية (نص فقط بدون صورة) */}
                        <td className="px-6 py-4">
                           <p className="text-xs font-bold text-gray-700 line-clamp-1 max-w-[220px]">
                             {displayProductName}
                           </p>
                           <p className="text-[10px] text-gray-500 font-bold mt-1.5 flex items-center gap-2">
                              <span>الكمية: <span className="text-[#008060] font-black">{displayQuantity}</span></span>
                              {hasMultiple && <span className="bg-gray-100 text-gray-600 px-1.5 rounded-sm text-[9px]">+ منتجات أخرى</span>}
                           </p>
                        </td>

                        {/* حالة الدفع */}
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order['Financial Status'])}`}>
                            {order['Financial Status']}
                          </span>
                        </td>

                        {/* الإجمالي */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-gray-900">{order.Total} EGP</p>
                        </td>

                        {/* زر التفاصيل */}
                        <td className="px-6 py-4 text-center">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto group-hover:border-[#008060] group-hover:bg-green-50 transition-colors">
                            <ChevronLeft size={16} className="text-gray-400 group-hover:text-[#008060]" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ترقيم الصفحات */}
          {!loading && filteredOrders.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs font-bold text-gray-500">
                عرض <span className="text-black">{indexOfFirstItem + 1}</span> إلى <span className="text-black">{Math.min(indexOfLastItem, filteredOrders.length)}</span> من أصل <span className="text-black">{filteredOrders.length}</span> طلب
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
                
                <span className="text-xs font-bold px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  صفحة {currentPage} من {totalPages}
                </span>

                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}