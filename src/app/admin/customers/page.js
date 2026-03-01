"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { 
  Users, Target, Mail, ShoppingCart, Download, Crown, 
  UserMinus, Search, Monitor, Archive, Layers 
} from "lucide-react";

const segmentsList = [
  { id: 'all', label: 'كل العملاء', icon: <Users size={16} /> },
  { id: 'Purchased_Once', label: 'اشتروا مرة واحدة', icon: <ShoppingCart size={16} /> },
  { id: 'Email_Subscriber', label: 'المشتركين', icon: <Mail size={16} /> },
  { id: 'Abandoned_Checkout', label: 'تركوا السلة', icon: <UserMinus size={16} /> },
  { id: 'VIP_Customer', label: 'اشتروا أكثر من مرة', icon: <Crown size={16} /> },
  { id: 'Potential_Customer', label: 'لم يشتروا بعد', icon: <Target size={16} /> },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeSegment, setActiveSegment] = useState('all');
  const [activeTab, setActiveTab] = useState('wind'); // التبويب الافتراضي
  const [search, setSearch] = useState("");
  
  const router = useRouter();

  useEffect(() => { fetchCustomers(); }, [activeSegment]);

  // فلترة متقدمة (بحث + تبويبات المنشأ)
  useEffect(() => {
    let result = customers;

    // 1. الفلترة حسب المنشأ (التبويبات)
    if (activeTab === 'shopify') {
      result = result.filter(c => c.data_source === 'Shopify_Import' || !c.data_source);
    } else if (activeTab === 'wind') {
      result = result.filter(c => c.data_source === 'WIND_Web'); 
    }

    // 2. الفلترة حسب البحث
    if (search) {
      result = result.filter(c => 
        (c.Email||'').toLowerCase().includes(search.toLowerCase()) || 
        (c['First Name']||'').toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredCustomers(result);
  }, [search, activeTab, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let q = collection(db, "Customers");
      if (activeSegment !== 'all') {
        q = query(q, where("segments", "array-contains", activeSegment));
      }
      const querySnapshot = await getDocs(q);
      setCustomers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // 🔥 دالة التصدير للإعلانات
  const exportToExcelForAds = () => {
    if(filteredCustomers.length === 0) return alert("لا توجد بيانات للتصدير");

    const headers = ["Email,Phone,FirstName,LastName,City,State,Zip,Country,Value,Currency,OrderCount,LastOrderStatus,Source,Tags"];

    const rows = filteredCustomers.map(c => {
      const email = (c.Email || c.email || '').toString().trim().toLowerCase();
      const phone = (c.Phone || c['Default Address Phone'] || '').toString().replace(/[^0-9+]/g, '');
      const firstName = c['First Name'] ? c['First Name'].toString().trim() : '';
      const lastName = c['Last Name'] ? c['Last Name'].toString().trim() : '';
      
      const city = c['Default Address City'] ? c['Default Address City'].toString().trim() : '';
      const state = c['Default Address Province'] ? c['Default Address Province'].toString().trim() : '';
      const zip = c['Default Address Zip'] ? c['Default Address Zip'].toString().trim() : '';
      const country = c['Default Address Country'] ? c['Default Address Country'].toString().trim() : 'EG';
      
      const value = c['Total Spent'] || 0;
      const currency = "EGP";
      const orderCount = c['Total Orders'] || 0;
      
      const lastOrderStatus = c.Last_Order_Status || '---'; 
      const source = c.data_source || 'Shopify_Import';
      const tags = c.Tags ? c.Tags.toString().trim().replace(/"/g, '""') : '';

      return `"${email}","${phone}","${firstName}","${lastName}","${city}","${state}","${zip}","${country}","${value}","${currency}","${orderCount}","${lastOrderStatus}","${source}","${tags}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    const fileName = activeTab === 'all' ? activeSegment : `${activeTab}_${activeSegment}`;
    link.download = `WIND_Ads_${fileName}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2"><Users className="text-[#008060]" /> إدارة العملاء</h1>
          
          <button 
            onClick={exportToExcelForAds} 
            className="bg-[#008060] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#006e52] transition-all"
          >
            <Download size={16} /> تصدير الشريحة المعروضة
          </button>
        </div>

        {/* التبويبات (Tabs) لفصل القديم عن الجديد */}
        <div className="flex gap-2 sm:gap-6 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('wind')} className={`flex items-center gap-2 pb-3 px-2 font-black text-sm transition-all whitespace-nowrap ${activeTab === 'wind' ? 'border-b-2 border-[#008060] text-[#008060]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Monitor size={16}/> عملاء موقع WIND
          </button>
          <button onClick={() => setActiveTab('shopify')} className={`flex items-center gap-2 pb-3 px-2 font-black text-sm transition-all whitespace-nowrap ${activeTab === 'shopify' ? 'border-b-2 border-[#008060] text-[#008060]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Archive size={16}/> أرشيف شوبيفاي
          </button>
          <button onClick={() => setActiveTab('all')} className={`flex items-center gap-2 pb-3 px-2 font-black text-sm transition-all whitespace-nowrap ${activeTab === 'all' ? 'border-b-2 border-[#008060] text-[#008060]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Layers size={16}/> كل العملاء
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* الشرائح الجانبية */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-bold text-gray-400 mb-4 px-2 uppercase tracking-widest">الشرائح (Segments)</p>
            {segmentsList.map((seg) => (
              <button key={seg.id} onClick={() => setActiveSegment(seg.id)} className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${activeSegment === seg.id ? 'bg-white shadow-sm border border-gray-200 text-[#008060]' : 'hover:bg-gray-200 text-gray-500'}`}>
                <div className="flex items-center gap-3 font-bold text-sm">{seg.icon} {seg.label}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-4 top-3.5 text-gray-400" size={18} />
                <input type="text" placeholder="ابحث بالاسم أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-12 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#008060] transition-all shadow-sm" />
              </div>
              <span className="text-xs font-bold text-gray-500 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                إجمالي المعروض: {filteredCustomers.length} عميل
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-5">العميل</th>
                    <th className="px-6 py-5">الإيميل / الهاتف</th>
                    <th className="px-6 py-5">الموقع</th>
                    <th className="px-6 py-5 text-center">الطلبات</th>
                    <th className="px-6 py-5">الإنفاق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <tr><td colSpan="5" className="text-center py-20 text-[#008060] font-black animate-pulse">جاري سحب الداتا...</td></tr> : 
                    filteredCustomers.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-20 text-gray-400 font-bold"><Archive size={40} className="mx-auto mb-3 opacity-20"/>لا يوجد عملاء في هذا القسم</td></tr>
                    ) : (
                    filteredCustomers.map((c) => {
                      const safeId = c.Email || c.Phone || c.id; // تم التعديل
                      const displayEmail = c.Email || c.email;
                      const displayPhone = c.Phone || c['Default Address Phone'];
                      
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/80 cursor-pointer group transition-all" onClick={() => router.push(`/admin/customers/${encodeURIComponent(safeId)}`)}>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-[#005bd3] group-hover:underline">{c['First Name']} {c['Last Name']}</p>
                            {/* لو العميل جديد هنحطله بادج مميز */}
                            {c.data_source === 'WIND_Web' && <span className="inline-block mt-1 bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold">WIND Customer</span>}
                          </td>
                          <td className="px-6 py-4">
                            {displayEmail ? <p className="text-[11px] font-bold font-mono text-gray-600 mb-1">{displayEmail}</p> : <p className="text-[11px] text-gray-400 mb-1">بدون إيميل</p>}
                            {displayPhone && <p className="text-[10px] text-gray-500 font-bold" dir="ltr">{displayPhone}</p>}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-700 line-clamp-1 max-w-[150px] mt-3">{c['Default Address City'] || '---'}</td>
                          <td className="px-6 py-4 text-sm font-black text-center">{c['Total Orders'] || 0}</td>
                          <td className="px-6 py-4 text-sm font-black text-[#008060]">{c['Total Spent'] || 0} EGP</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}