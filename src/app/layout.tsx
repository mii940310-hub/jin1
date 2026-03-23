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
  title: "슝팜(Shoong Farm) | 산지직송 AI 최저가 보장 농산물 직거래 플랫폼",
  description: "유통 마진 0원! 강원도 고랭지 신선 농산물을 농가에서 소비자에게 직접 연결하는 직거래 플랫폼 슝팜. 투명한 가격과 갓 수확한 신선도를 직접 경험해보세요.",
  keywords: ["슝팜", "shoong farm", "산지직송", "농가직거래", "강원도", "정선 농산물", "고랭지 배추", "당일수확", "농산물 플랫폼"],
  openGraph: {
    title: "슝팜(Shoong Farm) | 프리미엄 산지직송 직거래 플랫폼",
    description: "유통 과정을 없애 진짜 신선한 당일 수확 농산물을 가장 저렴하게! 슝팜에서 만나보세요.",
    url: "https://www.shoongfarm.com",
    siteName: "슝팜(Shoong Farm)",
    images: [{
      url: "https://www.shoongfarm.com/hero.jpg", // You can update this to an actual logo later
      width: 1200,
      height: 630,
      alt: "슝팜 산지직송 농산물",
    }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "슝팜(Shoong Farm)",
    description: "산지직송 AI 최저가 보장 농산물 직거래 플랫폼",
  },
  robots: {
    index: true,
    follow: true,
  }
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
