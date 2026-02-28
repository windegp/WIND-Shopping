"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { Users, Target, Mail, ShoppingCart, Download, Crown, UserMinus, Search, ChevronLeft } from "lucide-react";

// المسميات هنا مطابقة لصورة الفايربيس بتاعتك بالظبط (الكابيتال كابيتال)
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
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState('all');
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => { fetchCustomers(); }, [activeSegment]);

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

  const exportToExcel = () => {
    if(customers.length === 0) return alert("لا توجد بيانات للتصدير");
    const headers = ["الاسم,الإيميل,إجمالي الإنفاق,عدد الطلبات,المدينة,العنوان التفصيلي"];
    const rows = customers.map(c => `"${c['First Name']||''} ${c['Last Name']||''}","${c.Email||''}","${c['Total Spent']||0}","${c['Total Orders']||0}","${c['Default Address City']||''}","${c['Default Address Address1']||''}"`);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `WIND_${activeSegment}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 font-sans text-[#202223]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black flex items-center gap-2"><Users className="text-[#008060]" /> إدارة العملاء</h1>
          <button onClick={exportToExcel} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold flex gap-2 shadow-sm hover:bg-gray-50"><Download size={16} /> تصدير (Excel)</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-bold text-gray-400 mb-4 px-2 uppercase tracking-widest">الشرائح (Segments)</p>
            {segmentsList.map((seg) => (
              <button key={seg.id} onClick={() => setActiveSegment(seg.id)} className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${activeSegment === seg.id ? 'bg-white shadow-sm border border-gray-200 text-[#008060]' : 'hover:bg-gray-200 text-gray-500'}`}>
                <div className="flex items-center gap-3 font-bold text-sm">{seg.icon} {seg.label}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 relative">
              <Search className="absolute right-7 top-7 text-gray-400" size={18} />
              <input type="text" placeholder="ابحث بالاسم أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-3 bg-gray-50 border rounded-lg text-sm outline-none focus:border-[#008060] transition-all" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider"><tr><th className="px-6 py-4">العميل</th><th className="px-6 py-4">الموقع</th><th className="px-6 py-4 text-center">الطلبات</th><th className="px-6 py-4">الإنفاق</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan="4" className="text-center py-20 text-gray-400 font-bold animate-pulse">جاري التحميل...</td></tr> : 
                    customers.filter(c => c.Email?.includes(search) || c['First Name']?.includes(search)).map((c) => {
                      // 🔥 لو العميل ملوش إيميل، بناخد الـ ID بتاعه عشان ميضربش undefined
                      const safeId = c.Email || c.id; 
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 cursor-pointer group transition-all" onClick={() => router.push(`/admin/customers/${encodeURIComponent(safeId)}`)}>
                          <td className="px-6 py-4"><p className="text-sm font-bold text-[#005bd3] group-hover:underline">{c['First Name']} {c['Last Name']}</p><p className="text-[10px] text-gray-400 font-mono mt-0.5">{c.Email || 'بدون إيميل'}</p></td>
                          <td className="px-6 py-4 text-xs text-gray-600 line-clamp-1 max-w-[200px] mt-3">{c['Default Address City'] || '---'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-center">{c['Total Orders'] || 0}</td>
                          <td className="px-6 py-4 text-sm font-black text-[#008060]">{c['Total Spent'] || 0} EGP</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}