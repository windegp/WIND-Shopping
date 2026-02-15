"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'الرئيسية', path: '/admin', icon: '🏠' },
    { name: 'المنتجات', path: '/admin/products', icon: '👕' },
    { name: 'إضافة منتج', path: '/admin/products/create', icon: '➕' },
    { name: 'الأقسام', path: '/admin/collections', icon: '📂' },
    { name: 'الصفحات', path: '/admin/pages', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#1a1a1a] border-l border-[#333] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 border-b border-[#333] flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">WIND <span className="text-[#F5C518] text-xs">ADMIN</span></h1>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${pathname === item.path ? 'bg-[#F5C518] text-black font-bold' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-[#333]">
           <button className="w-full text-right text-gray-500 hover:text-red-500 text-sm">تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}