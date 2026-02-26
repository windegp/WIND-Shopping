"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from "@/lib/firebase"; // استيراد الحارس
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, 
  Palette, FolderTree, Menu, 
  FileText, LogOut, ChevronLeft, Lock 
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // الـ UID المسموح له بدخول منطقة الإدارة
  const ADMIN_UID = "jGb9wBMHZfRIQgR9yfbb3rkvzRw2";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const menu = [
    { name: 'الرئيسية', path: '/admin', icon: <LayoutDashboard size={20}/> },
    { name: 'المنتجات', path: '/admin/products', icon: <ShoppingBag size={20}/> },
    { name: 'إضافة منتج', path: '/admin/products/create', icon: <PlusCircle size={20}/> },
    { name: 'إدارة الواجهة', path: '/admin/home-manager', icon: <Palette size={20}/> },
    { name: 'الأقسام', path: '/admin/collections', icon: <FolderTree size={20}/> },
    { name: 'المنيو', path: '/admin/menu', icon: <Menu size={20}/> },
    { name: 'الصفحات', path: '/admin/pages', icon: <FileText size={20}/> },
  ];

  // 1. حالة التحميل (عشان ما نلمحش الداتا قبل التأكد)
  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#F5C518]">جاري التحقق...</div>;
  }

  // 2. حالة "لست الأدمن" أو "لم تسجل دخول"
  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-[#111] p-8 rounded-3xl border border-[#222] max-w-sm w-full shadow-2xl">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-[#F5C518]" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">منطقة محظورة</h2>
          <p className="text-gray-500 mb-8 text-sm">عذراً، يجب تسجيل الدخول بحساب المدير لتتمكن من عرض هذه الصفحة.</p>
          <button 
            onClick={() => router.push('/admin/login')}
            className="w-full py-4 bg-[#F5C518] text-black font-bold rounded-2xl hover:bg-yellow-400 transition-colors"
          >
            تسجيل الدخول كمدير
          </button>
        </div>
      </div>
    );
  }

  // 3. حالة "الأدمن الحقيقي" (يعرض المحتوى الطبيعي)
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
          
          {/* زرار تسجيل الخروج */}
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all mt-10"
          >
            <LogOut size={20}/>
            {isOpen && <span className="text-sm">خروج</span>}
          </button>
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#0a0a0a] p-8 lg:p-12 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}