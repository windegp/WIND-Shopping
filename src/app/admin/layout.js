"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, 
  Palette, FolderTree, Menu, 
  FileText, LogOut, ChevronLeft 
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const menu = [
    { name: 'الرئيسية', path: '/admin', icon: <LayoutDashboard size={20}/> },
    { name: 'المنتجات', path: '/admin/products', icon: <ShoppingBag size={20}/> },
    { name: 'إضافة منتج', path: '/admin/products/create', icon: <PlusCircle size={20}/> },
    { name: 'إدارة الواجهة', path: '/admin/home-manager', icon: <Palette size={20}/> },
    { name: 'الأقسام', path: '/admin/collections', icon: <FolderTree size={20}/> },
    { name: 'المنيو', path: '/admin/menu', icon: <Menu size={20}/> },
    { name: 'الصفحات', path: '/admin/pages', icon: <FileText size={20}/> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className={`bg-[#111] border-l border-[#222] transition-all duration-300 shadow-2xl ${isOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 border-b border-[#222] flex justify-between items-center h-20">
          {isOpen && <h1 className="font-black italic text-xl">WIND</h1>}
          <button onClick={() => setIsOpen(!isOpen)} className="text-[#F5C518] mx-auto"><Menu size={20}/></button>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          {menu.map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all ${active ? 'bg-[#F5C518] text-black font-bold shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-white'}`}>
                  {item.icon}
                  {isOpen && <span className="text-sm flex-1">{item.name}</span>}
                  {isOpen && active && <ChevronLeft size={14}/>}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#0a0a0a] p-8 lg:p-12 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}