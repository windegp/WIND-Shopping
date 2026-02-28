"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { 
  Users, Target, Mail, ShoppingCart, 
  Crown, UserMinus, Search, Filter, ChevronLeft 
} from "lucide-react";

const segmentsList = [
  { id: 'all', label: 'كل العملاء', icon: <Users size={16} />, color: 'gray' },
  { id: 'Purchased_At_Least_Once', label: 'اشتروا مرة واحدة', icon: <ShoppingCart size={16} />, color: 'blue' },
  { id: 'Email_Subscriber', label: 'المشتركين', icon: <Mail size={16} />, color: 'green' },
  { id: 'Abandoned_Checkout', label: 'تركوا السلة', icon: <UserMinus size={16} />, color: 'red' },
  { id: 'VIP_Customer', label: 'اشتروا أكثر من مرة', icon: <Crown size={16} />, color: 'purple' },
  { id: 'Potential_Customer', label: 'لم يشتروا بعد', icon: <Target size={16} />, color: 'orange' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState('all');
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [activeSegment]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let q = collection(db, "Customers");
      
      // لو اخترنا شريحة معينة، نفلتر باستخدام array-contains
      if (activeSegment !== 'all') {
        q = query(q, where("segments", "array-contains", activeSegment));
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(docs);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      {/* الهيدر */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="text-[#008060]" /> إدارة العملاء
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* الجانب الأيمن: القائمة الفرعية للشرائح (Segments) */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-bold text-gray-500 mb-4 px-2 tracking-widest uppercase">الشرائح (Segments)</p>
            {segmentsList.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeSegment === seg.id 
                  ? 'bg-white shadow-sm border border-gray-200 text-[#008060]' 
                  : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${activeSegment === seg.id ? 'text-[#008060]' : 'text-gray-400'}`}>
                    {seg.icon}
                  </span>
                  <span className="text-sm font-bold">{seg.label}</span>
                </div>
                <ChevronLeft size={14} className={activeSegment === seg.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}
          </div>

          {/* الجانب الأيسر: جدول البيانات */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              
              {/* بار البحث */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم، الإيميل، أو المدينة..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#008060]"
                  />
                </div>
              </div>

              {/* الجدول */}
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">العميل</th>
                      <th className="px-6 py-4">الموقع</th>
                      <th className="px-6 py-4">إجمالي الطلبات</th>
                      <th className="px-6 py-4">إجمالي الإنفاق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="4" className="text-center py-10 text-gray-400 animate-pulse">جاري تحميل البيانات...</td></tr>
                    ) : customers.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-10 text-gray-400">لا يوجد عملاء في هذه الشريحة</td></tr>
                    ) : (
                      customers.filter(c => 
                        c.Email?.toLowerCase().includes(search.toLowerCase()) || 
                        c['First Name']?.toLowerCase().includes(search.toLowerCase())
                      ).map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{customer['First Name']} {customer['Last Name']}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{customer.Email}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {customer['Default Address City'] || 'غير محدد'}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-center">
                            {customer['Total Orders'] || 0}
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-[#008060]">
                            {customer['Total Spent'] || 0} EGP
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}