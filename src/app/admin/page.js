"use client";
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ShoppingBag, Users, TrendingUp, Package, Layers } from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState({ products: 0, collections: 0, orders: 12, sales: 4500 });

  useEffect(() => {
    const fetchStats = async () => {
      const prodSnap = await getDocs(collection(db, "products"));
      const colSnap = await getDocs(collection(db, "collections"));
      setStats(prev => ({ ...prev, products: prodSnap.size, collections: colSnap.size }));
    };
    fetchStats();
  }, []);

  const cards = [
    { name: 'إجمالي المنتجات', value: stats.products, icon: <Package className="text-blue-500"/>, sub: 'منتج مسجل' },
    { name: 'الأقسام', value: stats.collections, icon: <Layers className="text-purple-500"/>, sub: 'كولكشن نشط' },
    { name: 'الطلبات الجديدة', value: stats.orders, icon: <ShoppingBag className="text-[#F5C518]"/>, sub: 'خلال هذا الأسبوع' },
    { name: 'إجمالي المبيعات', value: `ج.م ${stats.sales.toLocaleString()}`, icon: <TrendingUp className="text-green-500"/>, sub: 'تقديري' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white">لوحة تحكم <span className="text-[#F5C518]">WIND</span></h2>
        <p className="text-gray-500 text-sm">أهلاً بك يا ريس، إليك ملخص أداء المتجر اليوم.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#111] p-6 rounded-3xl border border-[#222] hover:border-[#F5C518]/50 transition-all group relative overflow-hidden shadow-xl">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-[#F5C518]/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-black rounded-2xl border border-[#222]">{card.icon}</div>
            </div>
            <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">{card.name}</h3>
            <p className="text-3xl font-black text-white mb-1">{card.value}</p>
            <p className="text-[10px] text-gray-600 font-bold">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-[#222] rounded-3xl p-8">
         <h3 className="text-lg font-bold mb-4">نشاط المتجر الأخير</h3>
         <div className="text-gray-600 text-sm italic py-10 text-center border-2 border-dashed border-[#222] rounded-2xl">جاري تجهيز سجل النشاطات...</div>
      </div>
    </div>
  );
}