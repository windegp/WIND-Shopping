"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, 
  Palette, FolderTree, Menu as MenuIcon, 
  FileText, LogOut, X, ChevronLeft 
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'الرئيسية', path: '/admin', icon: <LayoutDashboard size={20}/> },
    { name: 'المنتجات', path: '/admin/products', icon: <ShoppingBag size={20}/> },
    { name: 'إضافة منتج', path: '/admin/products/create', icon: <PlusCircle size={20}/> },
    { name: 'إدارة الواجهة', path: '/admin/home-manager', icon: <Palette size={20}/> },
    { name: 'الأقسام', path: '/admin/collections', icon: <FolderTree size={20}/> },
    { name: 'إدارة المنيو', path: '/admin/menu', icon: <MenuIcon size={20}/> },
    { name: 'الصفحات', path: '/admin/pages', icon: <FileText size={20}/> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#111] border-l border-[#222] transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-[#222] flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tighter">WIND <span className="text-[#F5C518] text-xs">ADMIN</span></h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X size={20}/></button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#F5C518] text-black font-bold' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm">{item.name}</span>
                  </div>
                  {isActive && <ChevronLeft size={14}/>}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-[#222]">
           <button className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold">
             <LogOut size={18}/> تسجيل الخروج
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#222] bg-[#111]/50 backdrop-blur-md flex items-center px-6 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-[#F5C518]"><MenuIcon size={24}/></button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}