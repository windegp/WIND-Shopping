"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Search, Filter, Package,
  ChevronLeft, ChevronRight, Truck 
} from "lucide-react";

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [productImages, setProductImages] = useState({}); // خريطة لحفظ صور المنتجات
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // إعدادات ترقيم الصفحات (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // عدد الطلبات في كل صفحة

  const router = useRouter();

  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  // فلترة الطلبات عند البحث
  useEffect(() => {
    const filtered = orders.filter(o => 
      o.Name?.toLowerCase().includes(search.toLowerCase()) || 
      o.Email?.toLowerCase().includes(search.toLowerCase()) ||
      o['Lineitem name']?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredOrders(filtered);
    setCurrentPage(1); // الرجوع للصفحة الأولى عند البحث
  }, [search, orders]);

  const fetchOrdersAndProducts = async () => {
    setLoading(true);
    try {
      // 1. جلب كل الأوردرات (بدون limit عشان نقدر نبحث فيهم كلهم براحتنا)
      const q = query(collection(db, "Orders"), orderBy("Created at", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(docs);
      setFilteredOrders(docs);

      // 2. جلب صور المنتجات من قاعدة البيانات لربطها بالأوردرات
      const pSnap = await getDocs(collection(db, "products"));
      const imgMap = {};
      pSnap.docs.forEach(doc => {
        const productData = doc.data();
        // بنحفظ الصورة المرتبطة باسم المنتج
        imgMap[productData.title] = productData.images?.[0] || null; 
      });
      setProductImages(imgMap);

    } catch (err) {
      console.error("Error fetching data:", err);
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
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* الهيدر */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShoppingBag className="text-[#008060]" /> جميع الطلبات
          </h1>
          <span className="text-xs font-bold text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            إجمالي السجلات: <span className="text-[#008060] font-black">{filteredOrders.length}</span> أوردر
          </span>
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

          {/* الجدول الرئيسي */}
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
                  <tr><td colSpan="6" className="text-center py-24 text-gray-400 font-bold">لا توجد طلبات مطابقة للبحث</td></tr>
                ) : (
                  currentOrders.map((order) => {
                    const productName = order['Lineitem name'];
                    const productImage = productImages[productName];
                    const quantity = order['Lineitem quantity'] || 1;

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

                        {/* المنتج والصورة والكمية (التعديل الجديد) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                              {productImage ? (
                                <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={16} className="text-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-700 line-clamp-1 max-w-[180px]">{productName}</p>
                              <p className="text-[10px] text-[#008060] font-black mt-1">
                                الكمية: <span className="bg-green-100 px-1.5 py-0.5 rounded-md">{quantity}</span>
                              </p>
                            </div>
                          </div>
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

          {/* ترقيم الصفحات (Pagination المبرمج حقيقي) */}
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