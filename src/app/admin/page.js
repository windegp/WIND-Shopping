"use client";
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function DashboardHome() {
  const [stats, setStats] = useState({ products: 0, orders: 0, sales: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const prodSnap = await getDocs(collection(db, "products"));
      // هنا يمكنك إضافة جلب الطلبات مستقبلاً
      setStats({ products: prodSnap.size, orders: 12, sales: 4500 }); // أرقام وهمية للطلبات
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">نظرة عامة</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cards */}
        <div className="bg-[#1a1a1a] p-6 rounded border border-[#333] hover:border-[#F5C518] transition">
          <h3 className="text-gray-400 text-sm mb-2">إجمالي المنتجات</h3>
          <p className="text-3xl font-bold text-white">{stats.products}</p>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded border border-[#333] hover:border-[#F5C518] transition">
          <h3 className="text-gray-400 text-sm mb-2">الطلبات الجديدة</h3>
          <p className="text-3xl font-bold text-[#F5C518]">{stats.orders}</p>
        </div>
        <div className="bg-[#1a1a1a] p-6 rounded border border-[#333] hover:border-[#F5C518] transition">
          <h3 className="text-gray-400 text-sm mb-2">المبيعات (ج.م)</h3>
          <p className="text-3xl font-bold text-green-500">{stats.sales.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}