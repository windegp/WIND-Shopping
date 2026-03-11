"use client";
import { useEffect } from "react";

export default function ComingSoon() {
  useEffect(() => {
    // منع أي scroll في الصفحة
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.28; }
        }
        @keyframes dotBlink {
          0%, 80%, 100% { opacity: 0.15; }
          40%           { opacity: 1; }
        }

        .ws-root {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: #121212;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cairo', sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          touch-action: none;
          overscroll-behavior: none;
        }

        .ws-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 55% 45% at 50% 50%, rgba(245,197,24,0.07) 0%, transparent 70%);
          animation: pulseGlow 5s ease-in-out infinite;
          pointer-events: none;
        }

        /* corner marks */
        .ws-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          opacity: 0.28;
        }
        .ws-corner-tl { top: 28px;    left: 28px;    border-top: 1px solid #F5C518; border-left: 1px solid #F5C518; }
        .ws-corner-tr { top: 28px;    right: 28px;   border-top: 1px solid #F5C518; border-right: 1px solid #F5C518; }
        .ws-corner-bl { bottom: 28px; left: 28px;    border-bottom: 1px solid #F5C518; border-left: 1px solid #F5C518; }
        .ws-corner-br { bottom: 28px; right: 28px;   border-bottom: 1px solid #F5C518; border-right: 1px solid #F5C518; }

        /* center block */
        .ws-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          padding: 0 24px;
        }

        /* brand name — two lines stacked */
        .ws-brand-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
        }
        .ws-wind {
          font-size: clamp(44px, 9vw, 82px);
          font-weight: 700;
          letter-spacing: 0.4em;
          text-indent: 0.4em; /* optical centering: shifts text right to visually center it */
          color: #ffffff;
          line-height: 1;
        }
        .ws-shopping {
          font-size: clamp(11px, 1.8vw, 15px);
          font-weight: 400;
          letter-spacing: 0.55em;
          text-indent: 0.55em; /* optical centering */
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          margin-top: 10px;
          line-height: 1;
        }

        /* gold divider */
        .ws-line {
          width: 36px;
          height: 1px;
          background: #F5C518;
          margin: 32px 0;
          transform-origin: center;
          transform: scaleX(0);
          opacity: 0;
          animation: lineGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.9s forwards;
        }

        /* Arabic text block */
        .ws-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          direction: rtl;
        }
        .ws-line1 {
          font-size: clamp(13px, 2.2vw, 16px);
          font-weight: 400;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.04em;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.1s forwards;
        }
        .ws-line2 {
          font-size: clamp(12px, 1.9vw, 14px);
          font-weight: 300;
          color: rgba(245,197,24,0.65);
          letter-spacing: 0.06em;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.3s forwards;
        }

        /* dots */
        .ws-dots {
          display: flex;
          gap: 8px;
          margin-top: 44px;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.6s forwards;
        }
        .ws-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #F5C518;
          animation: dotBlink 1.8s ease-in-out infinite;
        }
        .ws-dot:nth-child(2) { animation-delay: 0.25s; }
        .ws-dot:nth-child(3) { animation-delay: 0.5s; }
      `}</style>

      <div className="ws-root">
        <span className="ws-corner ws-corner-tl" />
        <span className="ws-corner ws-corner-tr" />
        <span className="ws-corner ws-corner-bl" />
        <span className="ws-corner ws-corner-br" />

        <div className="ws-center">
          <div className="ws-brand-wrap">
            <span className="ws-wind">WIND</span>
            <span className="ws-shopping">Shopping</span>
          </div>

          <div className="ws-line" />

          <div className="ws-text">
            <p className="ws-line1">نستعد لإطلاق تجربة تسوق جديدة</p>
            <p className="ws-line2">كونوا على استعداد</p>
          </div>

          <div className="ws-dots">
            <span className="ws-dot" />
            <span className="ws-dot" />
            <span className="ws-dot" />
          </div>
        </div>
      </div>
    </>
  );
}
