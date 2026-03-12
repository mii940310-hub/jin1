import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { getMissingEnvs, validateEnvs } from "@/lib/env-check";
import ChatBot from "@/components/ChatBot";

// Run validation in dev mode console
if (process.env.NODE_ENV === 'development') {
  validateEnvs();
}

export const metadata: Metadata = {
  title: "Highland Fresh | 강원 정선 고랭지 산지직송 직거래",
  description: "강원도 정선 고랭지 농산물을 산지에서 소비자에게 직배송하는 가격 투명 직거래 플랫폼입니다. 신선한 채소와 곡물을 합리적인 가격에 만나보세요.",
  keywords: "강원도, 정선, 고랭지, 채소, 곡물, 산지직송, 직거래, 신선식품",
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
          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/logo.png" alt="슝팜 로고" width={120} height={120} style={{ objectFit: 'contain' }} />
          </div>
          <div className="nav-links" style={{ display: 'flex', gap: '32px', fontWeight: 500 }}>
            <a href="/">상품 둘러보기</a>
            <a href="/cart">장바구니</a>
            <a href="/my-page/orders">마이페이지</a>
            <a href="/farmer">농가 홈</a>
            <a href="/admin" style={{ color: '#be185d' }}>총괄 관리자</a>
            <a href="/login">로그인</a>
          </div>
        </nav>
        <main>{children}</main>
        <footer style={{ padding: '80px 0', textAlign: 'center', background: 'var(--accent)', marginTop: '80px' }}>
          <div className="container">
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              © 2026 Highland Fresh. All rights reserved. <br />
              강원도 고랭지 채소·곡물 유통 혁신 플랫폼
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
