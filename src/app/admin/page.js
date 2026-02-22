"use client";
import { useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Package, TrendingUp, ShoppingCart } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 12, sales: 4500 });

  useEffect(() => {
    getDocs(collection(db, "products")).then(s => setStats(p => ({...p, products: s.size})));
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black">أهلاً بك في <span className="text-[#F5C518]">WIND</span></h2>
        <p className="text-gray-500 text-sm">نظرة سريعة على أداء متجرك اليوم.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'المنتجات', val: stats.products, icon: <Package/>, col: 'text-blue-500' },
          { label: 'الطلبات', val: stats.orders, icon: <ShoppingCart/>, col: 'text-[#F5C518]' },
          { label: 'المبيعات', val: `ج.م ${stats.sales}`, icon: <TrendingUp/>, col: 'text-green-500' },
        ].map((c, i) => (
          <div key={i} className="bg-[#111] p-8 rounded-3xl border border-[#222] hover:border-[#F5C518]/30 transition-all group">
            <div className={`p-3 rounded-2xl bg-black border border-[#222] mb-4 inline-block ${c.col}`}>{c.icon}</div>
            <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-widest">{c.label}</h3>
            <p className="text-3xl font-black">{c.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}