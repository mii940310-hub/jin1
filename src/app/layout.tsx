import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { getMissingEnvs, validateEnvs } from "@/lib/env-check";
import ChatBot from "@/components/ChatBot";
import Navigation from "@/components/Navigation";

// Run validation in dev mode console
if (process.env.NODE_ENV === 'development') {
  validateEnvs();
}

export const metadata: Metadata = {
  title: "슝팜 (Swoong Farm) | 농가 직거래 고랭지 산지직송",
  description: "고랭지 농산물을 농가에서 소비자에게 직접 연결하는 직거래 플랫폼 슝팜(Swoong Farm). 신선도와 가격 투명성을 직접 경험해보세요.",
  keywords: "슝팜, Swoong Farm, 강원도, 정선, 고랭지, 산지직송, 농가직거래, 신선식품, AI추천가격",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const missingEnvs = getMissingEnvs();

  return (
    <html lang="ko">
      <body>
        <EnvWarningBanner missingEnvs={missingEnvs} />
        <nav className="navbar" style={{ top: missingEnvs.length > 0 ? '40px' : '0' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
              슝팜 <span style={{ color: 'var(--primary-light)', fontWeight: 300 }}>Swoong Farm</span>
            </span>
          </div>
          {/* 동적 역할 기반 네비게이션 적용 (총괄/농가/일반 분리) */}
          <Navigation />
        </nav>
        <main>{children}</main>
        <footer style={{ padding: '60px 0', textAlign: 'center', background: 'var(--accent)', marginTop: '80px', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '12px' }}>슝팜 (Swoong Farm)</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              © 2026 슝팜 (Swoong Farm). All rights reserved. <br />
              농가 직거래 플랫폼 • 강원도 고랭지 채소 유통 혁신
            </p>
          </div>
        </footer>
        <ChatBot />
      </body>
    </html>
  );
}

function EnvWarningBanner({ missingEnvs }: { missingEnvs: string[] }) {
  if (missingEnvs.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      height: '40px',
      background: '#e63946',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.85rem',
      fontWeight: 600,
      zIndex: 1001,
      padding: '0 20px'
    }}>
      ⚠️ 필수 환경변수 누락: {missingEnvs.join(', ')} .env.local 설정을 확인하세요.
    </div>
  );
}
