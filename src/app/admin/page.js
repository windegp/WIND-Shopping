"use client";
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Package, ShoppingCart, TrendingUp, Layers } from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState({ products: 0, orders: 12, sales: 4500 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        setStats(prev => ({ ...prev, products: prodSnap.size }));
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'إجمالي المنتجات', value: stats.products, icon: <Package size={24}/>, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'الطلبات الجديدة', value: stats.orders, icon: <ShoppingCart size={24}/>, color: 'text-[#F5C518]', bg: 'bg-[#F5C518]/10' },
    { title: 'إجمالي المبيعات', value: `ج.م ${stats.sales.toLocaleString()}`, icon: <TrendingUp size={24}/>, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white">نظرة عامة</h2>
        <p className="text-gray-500 text-sm italic">مرحباً بك في مركز إدارة WIND.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#111] p-8 rounded-3xl border border-[#222] hover:border-[#333] transition-all group relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${card.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform`}></div>
            <div className={`mb-4 p-3 inline-block rounded-2xl ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <h3 className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-widest">{card.title}</h3>
            <p className="text-3xl font-black text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-[#222] rounded-3xl p-8 border-dashed">
         <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-600">
            <Layers size={40} strokeWidth={1}/>
            <p className="text-sm font-bold">لا توجد تنبيهات جديدة في الوقت الحالي.</p>
         </div>
      </div>
    </div>
  );
}