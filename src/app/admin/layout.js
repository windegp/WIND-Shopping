"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from "@/lib/firebase"; 
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

  // قائمة المنيو
  const menu = [
    { name: 'الرئيسية', path: '/admin', icon: <LayoutDashboard size={20}/> },
    { name: 'المنتجات', path: '/admin/products', icon: <ShoppingBag size={20}/> },
    { name: 'إضافة منتج', path: '/admin/products/create', icon: <PlusCircle size={20}/> },
    { name: 'إدارة الواجهة', path: '/admin/home-manager', icon: <Palette size={20}/> },
    { name: 'الأقسام', path: '/admin/collections', icon: <FolderTree size={20}/> },
    { name: 'المنيو', path: '/admin/menu', icon: <Menu size={20}/> },
    { name: 'الصفحات', path: '/admin/pages', icon: <FileText size={20}/> },
  ];

  // 1. حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#202223]"></div>
      </div>
    );
  }

  // 2. السماح لصفحة تسجيل الدخول بالظهور بدون قيود
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 3. حماية باقي صفحات الأدمن
  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 max-w-sm w-full shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-[#202223]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#202223] mb-2">منطقة محظورة</h2>
          <p className="text-gray-500 mb-8 text-sm">عذراً، يجب تسجيل الدخول بحساب المدير لتتمكن من إدارة الموقع.</p>
          
          <Link 
            href="/admin/login"
            className="w-full py-3 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-black transition-all block text-center shadow-sm"
          >
            تسجيل الدخول كمدير
          </Link>
        </div>
      </div>
    );
  }

  // 4. عرض لوحة التحكم للأدمن (بتصميم Shopify متوافق 100% مع الموبايل)
  return (
    <div className="h-screen bg-[#f4f6f8] text-[#202223] flex overflow-hidden font-sans" dir="rtl">
      
      {/* Mobile Overlay (خلفية شفافة عند فتح القائمة في الموبايل) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (القائمة الجانبية) */}
      <aside className={`fixed lg:relative z-50 h-full bg-[#ebebeb] border-l border-gray-300 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none flex flex-col ${
        isOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:translate-x-0 lg:w-20'
      }`}>
        <div className="p-4 lg:p-5 border-b border-gray-300 flex justify-between items-center h-16 lg:h-20 bg-[#ebebeb]">
          {isOpen && <h1 className="font-black text-xl tracking-tight text-[#202223] ml-2">WIND</h1>}
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:bg-gray-300 p-2 rounded-lg transition-colors mx-auto lg:mx-0 hidden lg:block">
            <Menu size={20}/>
          </button>
          <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:bg-gray-300 p-2 rounded-lg transition-colors lg:hidden">
            <ChevronLeft size={20}/>
          </button>
        </div>
        
        <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto scrollbar-hide">
          {menu.map((item) => {
            const active = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div onClick={() => { if(window.innerWidth < 1024) setIsOpen(false) }} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  active 
                  ? 'bg-white text-[#1a1a1a] font-bold shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-[#1a1a1a]'
                }`}>
                  <div className={`${active ? 'text-[#008060]' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  {isOpen && <span className="text-sm flex-1">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-300">
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20}/>
            {isOpen && <span className="text-sm font-bold">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content (المحتوى الأساسي) */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#f4f6f8] flex flex-col relative custom-scrollbar">
        
        {/* Mobile Header (البار العلوي يظهر في الموبايل فقط) */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button onClick={() => setIsOpen(true)} className="p-2 -m-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={24}/>
          </button>
          <h1 className="font-black text-lg text-[#202223]">WIND</h1>
          <div className="w-8"></div> {/* Spacer لضبط التوسيط */}
        </div>

        {/* مساحة عرض محتوى الصفحات */}
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1200px] mx-auto pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}