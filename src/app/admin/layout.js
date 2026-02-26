"use client";
import { useState, useEffect } from 'react'; // أضفنا useEffect
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db, auth } from "@/lib/firebase"; // تأكد من استيراد auth من ملف firebase
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, 
  Palette, FolderTree, Menu, 
  FileText, LogOut, ChevronLeft, Lock // أضفنا Lock للزينة
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  
  // --- الجزء الخاص بالحماية (Auth Logic) ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const ADMIN_UID = "jGb9wBMHZfRIQgR9yfbb3rkvzRw2"; // الـ UID بتاعك

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.uid === ADMIN_UID) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  // 1. شاشة التحميل
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#F5C518]">جاري التحقق...</div>;

  // 2. شاشة تسجيل الدخول (لو مش إنت الأدمن)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white" dir="rtl">
        <div className="bg-[#111] p-10 rounded-3xl border border-[#222] text-center space-y-6 max-w-md w-full">
          <div className="bg-[#F5C518]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-[#F5C518]/20">
            <Lock className="text-[#F5C518]" size={40} />
          </div>
          <h1 className="text-2xl font-black">لوحة تحكم WIND</h1>
          <p className="text-gray-500">هذه المنطقة مخصصة للمدير فقط. يرجى تسجيل الدخول للمتابعة.</p>
          <button 
            onClick={login}
            className="w-full bg-[#F5C518] text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
          >
            تسجيل الدخول باستخدام Google
          </button>
        </div>
      </div>
    );
  }

  // 3. كودك الأصلي كما هو (بيظهر فقط للأدمن)
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
          {/* زر تسجيل الخروج الإضافي */}
          <button onClick={logout} className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all mt-10">
            <LogOut size={20}/>
            {isOpen && <span className="text-sm">تسجيل الخروج</span>}
          </button>
        </nav>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto bg-[#0a0a0a] p-8 lg:p-12 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}