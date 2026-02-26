"use client";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // مراقبة حالة المستخدم
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("تم تسجيل الدخول بنجاح! يمكنك الآن الإضافة والحذف.");
      router.push("/admin"); // توجيهك للوحة التحكم بعد الدخول
    } catch (error) {
      console.error("Login Error:", error);
      alert("فشل تسجيل الدخول: " + error.message);
    }
  };

  const logout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-[#111] border border-[#222] p-8 rounded-3xl text-center shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-6 italic">WIND <span className="text-[#F5C518]">ADMIN</span></h1>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-gray-400">مرحباً، {user.displayName}</p>
            <p className="text-xs text-gray-600 break-all">{user.uid}</p>
            <button 
              onClick={() => router.push("/admin")}
              className="w-full py-4 bg-[#F5C518] text-black font-bold rounded-2xl hover:scale-[1.02] transition-transform"
            >
              الذهاب للوحة التحكم
            </button>
            <button onClick={logout} className="text-red-500 text-sm hover:underline">تسجيل الخروج</button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">يجب تسجيل الدخول بصفتك المدير لتتمكن من تعديل البيانات.</p>
            <button 
              onClick={loginWithGoogle}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
              الدخول باستخدام Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}