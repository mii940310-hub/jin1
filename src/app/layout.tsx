import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';
import ChatBot from '@/components/ChatBot';
import Navigation from '@/components/Navigation';
import { getMissingEnvs, validateEnvs } from '@/lib/env-check';

if (process.env.NODE_ENV === 'development') {
    validateEnvs();
}

export const metadata: Metadata = {
    title: '숨팜 | 농가 직송 농산물 플랫폼',
    description: '농가는 쉽게 상품을 등록하고, 소비자는 신선한 농산물을 바로 만날 수 있는 직거래 플랫폼입니다.',
    keywords: ['숨팜', '농가직송', '농산물', '직거래', '신선식품', '농가 판매'],
    openGraph: {
        title: '숨팜 | 농가 직송 농산물 플랫폼',
        description: '농가가 쉽게 판매를 시작하고 소비자가 더 믿고 고를 수 있는 직거래 서비스입니다.',
        url: 'https://www.shoongfarm.co.kr',
        siteName: '숨팜',
        images: [
            {
                url: 'https://www.shoongfarm.co.kr/logo.png',
                width: 1200,
                height: 630,
                alt: '숨팜 로고',
            },
        ],
        locale: 'ko_KR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: '숨팜 | 농가 직송 농산물 플랫폼',
        description: 'AI로 상품 설명과 판매 자동화를 돕는 농산물 직거래 플랫폼입니다.',
    },
    robots: {
        index: true,
        follow: true,
    },
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
                    <div className="logo" style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                        <Link href="/" style={{ alignItems: 'center', display: 'flex', height: '100%', textDecoration: 'none' }}>
                            <Image
                                alt="숨팜 로고"
                                height={64}
                                src="/logo.png"
                                style={{ height: '64px', objectFit: 'contain', width: 'auto' }}
                                width={160}
                            />
                        </Link>
                    </div>
                    <Navigation />
                </nav>
                <main>{children}</main>
                <footer style={{ background: 'var(--accent)', borderTop: '1px solid var(--border)', marginTop: '80px', padding: '60px 0', textAlign: 'center' }}>
                    <div className="container">
                        <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '12px' }}>숨팜</h2>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            © 2026 숨팜. All rights reserved.
                            <br />
                            복잡한 판매 준비를 줄여주는 농산물 직거래 플랫폼
                        </p>
                    </div>
                </footer>
                <ChatBot />
            </body>
        </html>
    );
}

function EnvWarningBanner({ missingEnvs }: { missingEnvs: string[] }) {
    if (missingEnvs.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                alignItems: 'center',
                background: '#e63946',
                color: 'white',
                display: 'flex',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '40px',
                justifyContent: 'center',
                padding: '0 20px',
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 1001,
            }}
        >
            필수 환경 변수가 비어 있습니다: {missingEnvs.join(', ')}. `.env.local` 설정을 확인해 주세요.
        </div>
    );
}
