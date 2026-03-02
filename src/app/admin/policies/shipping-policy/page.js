"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, MapPin, Clock, Truck, CreditCard, PackageCheck, AlertCircle } from "lucide-react";

export default function ShippingPolicyPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // جلب النص اللي إنت كتبته في لوحة التحكم
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const docRef = doc(db, "Policies", "shipping-policy");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().content || "");
        }
      } catch (err) {
        console.error("Error fetching policy:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="animate-spin text-[#008060]" size={40} />
      </div>
    );
  }

  return (
    <div className="sp font-sans" dir="rtl">
      <style jsx>{`
        :root {
          --wind-green: #008060;
          --wind-yellow: #F5C518;
          --royal: #0d1117;
          --royal-mid: #161b22;
          --glass-bg: rgba(255, 255, 255, 0.92);
          --glass-bdr: rgba(255, 255, 255, 0.5);
          --text-dark: #1a1a1a;
          --text-mid: #4a4a4a;
        }

        .sp {
          background: var(--royal);
          min-height: 100vh;
          color: var(--text-dark);
          position: relative;
          padding-bottom: 50px;
        }

        .bg__base {
          position: fixed; inset: 0;
          background: linear-gradient(to bottom, #ffffff 0%, #ffffff 80px, var(--royal) 150px, var(--royal-mid) 100%);
          z-index: 0;
        }

        .header {
          position: relative; z-index: 1;
          text-align: center;
          padding: 30px 20px;
        }

        .logo {
          width: 100px; height: auto;
          margin: 0 auto 15px;
          border-radius: 15px;
        }

        .title { font-size: 1.5rem; font-weight: 900; color: #fff; margin-bottom: 5px; }
        .sub { font-size: 0.85rem; color: rgba(255,255,255,0.7); }

        main {
          position: relative; z-index: 1;
          max-width: 500px; margin: 0 auto;
          padding: 0 16px;
          display: flex; flex-direction: column; gap: 15px;
        }

        .card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-bdr);
          border-radius: 20px;
          padding: 20px;
          backdrop-filter: blur(15px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .card__head { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
        .card__icon {
          width: 40px; height: 40px;
          background: rgba(0, 128, 96, 0.1);
          border: 1px solid rgba(0, 128, 96, 0.2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--wind-green);
        }

        .card__title { font-size: 0.95rem; font-weight: 800; }
        .card__en { font-size: 0.65rem; color: #999; text-transform: uppercase; display: block; }

        .row {
          display: flex; align-items: center; justify-content: space-between;
          background: white; padding: 12px 15px;
          border-radius: 12px; margin-bottom: 8px;
          border: 1px solid #eee;
        }
        .row__region { font-size: 0.85rem; font-weight: 700; }
        .row__days { font-size: 0.75rem; color: var(--wind-green); font-weight: 800; background: rgba(0,128,96,0.05); padding: 4px 10px; border-radius: 10px; }

        .free-banner {
          background: linear-gradient(135deg, #fff 0%, #f9f9f9 100%);
          border: 2px dashed var(--wind-green);
          border-radius: 20px; padding: 20px;
          display: flex; align-items: center; gap: 15px;
        }
        .badge {
          width: 55px; height: 55px; border-radius: 50%;
          background: var(--wind-green); color: white;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.7rem;
        }

        .content-area {
          font-size: 0.85rem; line-height: 1.8; color: var(--text-mid);
          white-space: pre-wrap;
        }

        .step { display: flex; gap: 15px; margin-bottom: 15px; }
        .step__num {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--wind-yellow); color: #000;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.8rem; flex-shrink: 0;
        }
      `}</style>

      <div className="bg__base"></div>

      <header className="header">
        <img 
          src="https://ik.imagekit.io/windeg/WIND_Shopping/logo_0WuyNIRzi.jpg?updatedAt=1772130133302" 
          className="logo shadow-lg" 
          alt="WIND Shopping" 
        />
        <h1 className="title">سياسة الشحن والتوصيل</h1>
        <p className="sub">نحن نتحرك بسرعة الرياح لتصلك أناقتك في أسرع وقت.</p>
      </header>

      <main>
        {/* المناطق */}
        <div className="card">
          <div className="card__head">
            <div className="card__icon"><MapPin size={20} /></div>
            <div>
              <span className="card__title">نطاق التغطية</span>
              <span className="card__en">Delivery Scope</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">نقوم بالتوصيل لجميع أنحاء جمهورية مصر العربية، من الإسكندرية إلى أسوان.</p>
        </div>

        {/* مدة التوصيل الحالية */}
        <div className="card">
          <div className="card__head">
            <div className="card__icon"><Clock size={20} /></div>
            <div>
              <span className="card__title">مدة التوصيل المتوقعة</span>
              <span className="card__en">Estimated Time</span>
            </div>
          </div>
          <div className="row">
            <span className="row__region">القاهرة والجيزة</span>
            <span className="row__days">24 - 48 ساعة</span>
          </div>
          <div className="row">
            <span className="row__region">باقي المحافظات</span>
            <span className="row__days">3 - 5 أيام عمل</span>
          </div>
        </div>

        {/* العرض المجاني */}
        <div className="free-banner">
          <div className="badge">
            <span>FREE</span>
            <span className="text-[10px]">SHIPPING</span>
          </div>
          <div>
            <h3 className="font-black text-sm text-gray-900">شحن مجاني للطلبات الكبيرة</h3>
            <p className="text-xs text-gray-500">استمتع بشحن مجاني عند طلبك بمبلغ أكثر من 1,999 ج.م</p>
          </div>
        </div>

        {/* النص الديناميكي من لوحة التحكم */}
        <div className="card border-t-4 border-t-[#008060]">
          <div className="card__head">
            <div className="card__icon"><Truck size={20} /></div>
            <div>
              <span className="card__title">تفاصيل إضافية</span>
              <span className="card__en">Additional Info</span>
            </div>
          </div>
          <div className="content-area">
            {content || "سيتم إضافة تفاصيل الشحن الإضافية قريباً من قبل الإدارة."}
          </div>
        </div>

        {/* التتبع */}
        <div className="card">
          <div className="card__head">
            <div className="card__icon"><PackageCheck size={20} /></div>
            <div>
              <span className="card__title">تتبع شحنتك</span>
              <span className="card__en">Order Tracking</span>
            </div>
          </div>
          <div className="step">
            <div className="step__num">1</div>
            <p className="text-xs text-gray-600 font-bold">تأكيد الطلب عبر واتساب أو الهاتف.</p>
          </div>
          <div className="step">
            <div className="step__num">2</div>
            <p className="text-xs text-gray-600 font-bold">استلام رسالة برقم التتبع فور خروج الشحنة.</p>
          </div>
        </div>
      </main>
    </div>
  );
}