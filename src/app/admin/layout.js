"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, PlusCircle, Palette, FolderTree, Menu, FileText, LogOut, X, Menu as MenuIcon } from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'الرئيسية', path: '/admin', icon: <LayoutDashboard size={18}/> },
    { name: 'المنتجات', path: '/admin/products', icon: <ShoppingBag size={18}/> },
    { name: 'إضافة منتج', path: '/admin/products/create', icon: <PlusCircle size={18}/> },
    { name: 'إدارة الواجهة', path: '/admin/home-manager', icon: <Palette size={18}/> },
    { name: 'الأقسام', path: '/admin/collections', icon: <FolderTree size={18}/> },
    { name: 'إدارة المنيو', path: '/admin/menu', icon: <MenuIcon size={18}/> },
    { name: 'الصفحات', path: '/admin/pages', icon: <FileText size={18}/> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#111] border-l border-[#222] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0 shadow-2xl`}>
        <div className="p-6 border-b border-[#222] flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter italic">WIND <span className="text-[#F5C518] text-xs not-italic">CMS</span></h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X/></button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#F5C518] text-black font-black shadow-[0_10px_20px_rgba(245,197,24,0.2)]' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-[#222] bg-[#111]">
           <button className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold"><LogOut size={16}/> تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#222] bg-[#111]/50 backdrop-blur-md flex items-center px-8 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-[#F5C518]"><MenuIcon size={24}/></button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#0a0a0a] custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}