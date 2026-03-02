"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function ShippingPolicyPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: '#F5C518' }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

        :root {
          --royal:      #000000;
          --royal-mid:  #111111;
          --gold-dim:   #0d0b00;
          --gold-mid:   #1a1400;
          --glass-bg:   rgba(26,20,0,.92);
          --glass-bdr:  rgba(245,197,24,.18);
          --text-dark:  #f5f5f5;
          --text-mid:   #cccccc;
          --text-dim:   #888888;
          --gold-acc:   #F5C518;
          --gold-lt:    #f7d04a;
          --trans:      .3s cubic-bezier(.4,0,.2,1);
        }

        .sp *, .sp *::before, .sp *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        .sp {
          font-family: 'Cairo', sans-serif;
          color: var(--text-dark);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          background: var(--royal);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          direction: rtl;
        }

        /* ─── BG ─── */
        .sp .bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
        }
        .sp .bg__base {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            #F5C518 0%,
            #F5C518 75px,
            #000000 140px,
            #111111 45%,
            #0d0b00 75%,
            #1a1400 100%
          );
        }
        .sp .bg__glow--1 {
          position: absolute;
          width: 360px; height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,197,24,.2) 0%, transparent 70%);
          top: 30%; right: -80px;
          filter: blur(40px);
        }
        .sp .bg__glow--2 {
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,197,24,.12) 0%, transparent 70%);
          bottom: 10%; left: -60px;
          filter: blur(50px);
        }

        /* ─── HEADER ─── */
        .sp header {
          position: relative; z-index: 1;
          text-align: center;
          padding: 18px 20px 28px;
        }
        .sp .header__brand {
          display: inline-flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
        }
        .sp .header__logo {
          width: 90px; height: auto; display: block;
        }
        .sp .header__title {
          font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 4px;
        }
        .sp .header__sub {
          font-size: .75rem; font-weight: 300;
          color: rgba(255,255,255,.65);
          max-width: 320px; margin: 0 auto;
        }

        /* ─── MAIN ─── */
        .sp main {
          position: relative; z-index: 1;
          max-width: 480px; margin: 0 auto;
          padding: 12px 16px 48px;
          display: flex; flex-direction: column; gap: 10px;
        }

        /* ─── CARD ─── */
        .sp .card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-bdr);
          border-radius: 14px;
          padding: 18px 18px 16px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            0 2px 12px rgba(0,0,0,.4),
            inset 0 1px 0 rgba(245,197,24,.08);
          opacity: 0;
          transform: translateY(16px);
          animation: sp-slide .45s cubic-bezier(.4,0,.2,1) forwards;
        }
        .sp .card:nth-child(1){animation-delay:.06s}
        .sp .card:nth-child(2){animation-delay:.12s}
        .sp .card:nth-child(3){animation-delay:.18s}
        .sp .card:nth-child(4){animation-delay:.24s}
        .sp .card:nth-child(5){animation-delay:.30s}
        .sp .card:nth-child(6){animation-delay:.36s}
        .sp .card:nth-child(7){animation-delay:.42s}

        @keyframes sp-slide { to { opacity: 1; transform: translateY(0); } }

        /* ─── CARD HEAD ─── */
        .sp .card__head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px; flex-direction: row;
        }
        .sp .card__icon {
          width: 34px; height: 34px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(245,197,24,.15), rgba(245,197,24,.07));
          border: 1px solid rgba(245,197,24,.25);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }
        .sp .card__icon svg {
          width: 16px; height: 16px; color: var(--gold-acc);
        }
        .sp .card__title { font-size: .82rem; font-weight: 700; color: var(--text-dark); }
        .sp .card__en {
          font-size: .6rem; color: var(--text-dim);
          letter-spacing: .1em; text-transform: uppercase;
          display: block; margin-top: 1px;
        }

        /* ─── PROSE ─── */
        .sp .card p {
          font-size: .77rem; color: var(--text-mid); font-weight: 400;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ─── ROWS ─── */
        .sp .rows { display: flex; flex-direction: column; gap: 6px; }
        .sp .row {
          display: flex; align-items: center; gap: 10px; flex-direction: row;
          background: rgba(245,197,24,.04);
          border: 1px solid rgba(245,197,24,.12);
          border-radius: 9px; padding: 9px 12px;
          transition: background var(--trans), border-color var(--trans);
        }
        .sp .row:hover {
          background: rgba(245,197,24,.09);
          border-color: rgba(245,197,24,.3);
        }
        .sp .row__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sp .row__dot--1 { background: #F5C518; box-shadow: 0 0 5px rgba(245,197,24,.6); }
        .sp .row__dot--2 { background: #d4a017; box-shadow: 0 0 5px rgba(212,160,23,.5); }
        .sp .row__dot--3 { background: #a07810; box-shadow: 0 0 5px rgba(160,120,16,.5); }
        .sp .row__region {
          flex: 1; font-size: .76rem; font-weight: 600; color: var(--text-dark);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sp .row__days {
          flex-shrink: 0; font-size: .68rem; font-weight: 700;
          color: #000; background: var(--gold-acc);
          padding: 3px 9px; border-radius: 14px; white-space: nowrap;
        }

        /* ─── NOTE ─── */
        .sp .note {
          display: flex; align-items: flex-start; gap: 7px; flex-direction: row;
          margin-top: 10px;
          background: rgba(245,197,24,.06);
          border: 1px solid rgba(245,197,24,.2);
          border-radius: 8px; padding: 8px 10px;
        }
        .sp .note svg { width: 13px; height: 13px; flex-shrink: 0; color: #F5C518; margin-top: 1px; }
        .sp .note span { font-size: .68rem; color: #c9a200; font-weight: 400; }

        /* ─── FREE BANNER ─── */
        .sp .free-banner {
          background: rgba(26,20,0,.92);
          border: 1px solid rgba(245,197,24,.3);
          border-radius: 14px; padding: 14px 16px;
          display: flex; align-items: center; gap: 14px; flex-direction: row;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 2px 10px rgba(0,0,0,.4);
          opacity: 0; transform: translateY(16px);
          animation: sp-slide .45s .21s cubic-bezier(.4,0,.2,1) forwards;
        }
        .sp .free-banner__badge {
          flex-shrink: 0; width: 52px; height: 52px; border-radius: 50%;
          border: 1.5px solid var(--gold-acc);
          background: rgba(245,197,24,.12);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .sp .free-banner__badge-free {
          font-size: .62rem; font-weight: 700; color: var(--gold-acc);
          text-transform: uppercase; letter-spacing: .05em;
        }
        .sp .free-banner__badge-ship {
          font-size: .48rem; color: rgba(245,197,24,.6);
          text-transform: uppercase; letter-spacing: .08em; font-weight: 400;
        }
        .sp .free-banner__body h3 { font-size: .78rem; font-weight: 700; color: #f5f5f5; margin-bottom: 2px; }
        .sp .free-banner__body p { font-size: .7rem; color: #cccccc; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sp .free-banner__body strong { color: var(--gold-acc); font-weight: 700; }

        /* ─── STEPS ─── */
        .sp .steps { display: flex; flex-direction: column; }
        .sp .step { display: flex; gap: 12px; flex-direction: row; }
        .sp .step__col {
          display: flex; flex-direction: column;
          align-items: center; flex-shrink: 0; width: 28px;
        }
        .sp .step__dot {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(245,197,24,.12);
          border: 1.5px solid var(--gold-acc);
          display: flex; align-items: center; justify-content: center;
          font-size: .65rem; font-weight: 700; color: var(--gold-acc);
        }
        .sp .step__line {
          width: 1.5px; flex: 1; min-height: 18px;
          background: linear-gradient(to bottom, var(--gold-acc), rgba(245,197,24,.1));
        }
        .sp .step:last-child .step__line { display: none; }
        .sp .step__body { padding-bottom: 16px; }
        .sp .step__body h4 { font-size: .74rem; font-weight: 700; color: var(--text-dark); margin-bottom: 2px; }
        .sp .step__body p { font-size: .68rem; color: var(--text-mid); font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ─── DYNAMIC CONTENT ─── */
        .sp .content-area {
          font-size: .77rem; line-height: 1.9;
          color: var(--text-mid); white-space: pre-wrap;
        }

        @media(max-width:360px){
          .sp .card { padding: 14px 14px 12px; }
          .sp .card__head { gap: 8px; margin-bottom: 10px; }
          .sp .row { padding: 8px 10px; }
          .sp .free-banner { padding: 12px 13px; gap: 11px; }
        }
      `}</style>

      <div className="sp">
        {/* BG */}
        <div className="bg">
          <div className="bg__base" />
          <div className="bg__glow--1" />
          <div className="bg__glow--2" />
        </div>

        {/* HEADER */}
        <header>
          <div className="header__brand">
            <img
              src="https://ik.imagekit.io/windeg/WIND_Shopping/logo_0WuyNIRzi.jpg?updatedAt=1772130133302"
              className="header__logo"
              alt="WIND Shopping"
            />
          </div>
          <h1 className="header__title">سياسة الشحن والتوصيل</h1>
          <p className="header__sub">نوصل طلباتكم بسرعة الرياح إلى كل مكان في مصر.</p>
        </header>

        <main>
          {/* نطاق التغطية */}
          <div className="card">
            <div className="card__head">
              <div className="card__icon">
                <svg stroke-linejoin="round" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle r="2.5" cy="9" cx="12" />
                </svg>
              </div>
              <div>
                <div className="card__title">مناطق التوصيل</div>
                <span className="card__en">Delivery Zones</span>
              </div>
            </div>
            <p>نوصل إلى جميع محافظات مصر العربية، من الإسكندرية إلى أسوان، دون استثناء.</p>
          </div>

          {/* مدة التوصيل */}
          <div className="card">
            <div className="card__head">
              <div className="card__icon">
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <circle r="10" cy="12" cx="12" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className="card__title">مدة التوصيل المتوقعة</div>
                <span className="card__en">Estimated Time</span>
              </div>
            </div>
            <div className="rows">
              <div className="row">
                <span className="row__dot row__dot--1" />
                <span className="row__region">القاهرة والجيزة</span>
                <span className="row__days">24 – 48 ساعة</span>
              </div>
              <div className="row">
                <span className="row__dot row__dot--2" />
                <span className="row__region">الإسكندرية والوجه البحري</span>
                <span className="row__days">3 – 4 أيام</span>
              </div>
              <div className="row">
                <span className="row__dot row__dot--3" />
                <span className="row__region">باقي المحافظات والصعيد</span>
                <span className="row__days">3 – 5 أيام</span>
              </div>
            </div>
            <div className="note">
              <svg strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <circle r="10" cy="12" cx="12" />
                <line y2="12" x2="12" y1="16" x1="12" />
                <line y2="8" x2="12.01" y1="8" x1="12" />
              </svg>
              <span>قد تتأخر المدة قليلاً خلال العروض والإجازات الرسمية.</span>
            </div>
          </div>

          {/* شحن مجاني */}
          <div className="free-banner">
            <div className="free-banner__badge">
              <span className="free-banner__badge-free">مجاني</span>
              <span className="free-banner__badge-ship">شحن</span>
            </div>
            <div className="free-banner__body">
              <h3>شحن مجاني للطلبات الكبيرة</h3>
              <p>تلقائياً على كل طلب فوق <strong>1,999 ج.م</strong> دون شروط.</p>
            </div>
          </div>

          {/* تكلفة الشحن */}
          <div className="card">
            <div className="card__head">
              <div className="card__icon">
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <rect rx="2" height="16" width="22" y="4" x="1" />
                  <line y2="10" x2="23" y1="10" x1="1" />
                </svg>
              </div>
              <div>
                <div className="card__title">تكلفة الشحن</div>
                <span className="card__en">Shipping Cost</span>
              </div>
            </div>
            <p>تظهر التكلفة النهائية تلقائياً في صفحة الدفع بناءً على محافظتك.</p>
          </div>

          {/* تتبع الطلب */}
          <div className="card">
            <div className="card__head">
              <div className="card__icon">
                <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <rect rx="2" height="13" width="15" y="3" x="1" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16" />
                  <circle r="2.5" cy="18.5" cx="5.5" />
                  <circle r="2.5" cy="18.5" cx="18.5" />
                </svg>
              </div>
              <div>
                <div className="card__title">تأكيد وتتبع الطلب</div>
                <span className="card__en">Order Tracking</span>
              </div>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step__col">
                  <div className="step__dot">١</div>
                  <div className="step__line" />
                </div>
                <div className="step__body">
                  <h4>تأكيد الطلب</h4>
                  <p>تصلك رسالة تأكيد فورية عبر الواتساب والهاتف بعد الدفع.</p>
                </div>
              </div>
              <div className="step">
                <div className="step__col">
                  <div className="step__dot">٢</div>
                  <div className="step__line" />
                </div>
                <div className="step__body">
                  <h4>شحن الطلب</h4>
                  <p>تصلك رسالة ثانية فيها رقم التتبع فور شحن الطلب.</p>
                </div>
              </div>
              <div className="step">
                <div className="step__col">
                  <div className="step__dot">٣</div>
                </div>
                <div className="step__body">
                  <h4>متابعة الشحنة</h4>
                  <p>استخدم رقم التتبع في أي وقت لمعرفة مكان شحنتك.</p>
                </div>
              </div>
            </div>
          </div>

          {/* التفاصيل الإضافية من Firebase */}
          {content ? (
            <div className="card">
              <div className="card__head">
                <div className="card__icon">
                  <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <div className="card__title">تفاصيل إضافية</div>
                  <span className="card__en">Additional Info</span>
                </div>
              </div>
              <div className="content-area">{content}</div>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}