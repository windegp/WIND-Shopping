"use client";
import { useEffect, useState } from "react";

export default function ComingSoon() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.35; }
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
        }

        /* subtle radial light at center */
        .ws-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,197,24,0.06) 0%, transparent 70%);
          animation: pulse-glow 4s ease-in-out infinite;
          pointer-events: none;
        }

        /* thin top + bottom edge lines */
        .ws-edge {
          position: absolute;
          left: 40px;
          right: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,197,24,0.25), transparent);
        }
        .ws-edge-top    { top: 36px; }
        .ws-edge-bottom { bottom: 36px; }

        .ws-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          text-align: center;
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
        }

        /* WIND wordmark */
        .ws-brand {
          font-size: clamp(52px, 10vw, 96px);
          font-weight: 700;
          letter-spacing: 0.35em;
          color: #ffffff;
          line-height: 1;
          margin: 0;
          padding-right: 0.35em; /* compensate letter-spacing so it looks centered */
        }

        /* gold separator line */
        .ws-line {
          width: 40px;
          height: 1px;
          background: #F5C518;
          margin: 28px auto;
          transform-origin: center;
          transform: scaleX(0);
          animation: lineGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.9s forwards;
        }

        /* Arabic tagline */
        .ws-tagline {
          font-size: clamp(13px, 2vw, 15px);
          font-weight: 300;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.45);
          margin: 0;
          direction: rtl;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.1s forwards;
        }

        /* loading dots */
        .ws-dots {
          display: flex;
          gap: 7px;
          margin-top: 48px;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.4s forwards;
        }
        .ws-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #F5C518;
          animation: dotBlink 1.6s ease-in-out infinite;
        }
        .ws-dot:nth-child(2) { animation-delay: 0.2s; }
        .ws-dot:nth-child(3) { animation-delay: 0.4s; }

        /* corner marks — purely decorative */
        .ws-corner {
          position: absolute;
          width: 14px;
          height: 14px;
          opacity: 0.3;
        }
        .ws-corner-tl { top: 32px;    left: 32px;    border-top: 1px solid #F5C518; border-left: 1px solid #F5C518; }
        .ws-corner-tr { top: 32px;    right: 32px;   border-top: 1px solid #F5C518; border-right: 1px solid #F5C518; }
        .ws-corner-bl { bottom: 32px; left: 32px;    border-bottom: 1px solid #F5C518; border-left: 1px solid #F5C518; }
        .ws-corner-br { bottom: 32px; right: 32px;   border-bottom: 1px solid #F5C518; border-right: 1px solid #F5C518; }
      `}</style>

      <div className="ws-root" style={{ colorScheme: "dark" }}>
        {/* corner accents */}
        <span className="ws-corner ws-corner-tl" />
        <span className="ws-corner ws-corner-tr" />
        <span className="ws-corner ws-corner-bl" />
        <span className="ws-corner ws-corner-br" />

        {/* edge lines */}
        <span className="ws-edge ws-edge-top" />
        <span className="ws-edge ws-edge-bottom" />

        {/* main content */}
        <div className="ws-center">
          <h1 className="ws-brand">WIND</h1>
          <div className="ws-line" />
          <p className="ws-tagline">نستعد لإطلاق تجربة تسوق جديدة</p>
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
