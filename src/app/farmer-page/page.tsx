'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const benefitCards = [
    {
        title: '카카오로 바로 시작',
        description: '복잡한 회원가입 없이 카카오 계정으로 바로 농가 센터를 시작할 수 있습니다.',
    },
    {
        title: '사진과 음성으로 판매 준비',
        description: '상품 사진과 말로 남긴 설명만 있어도 판매 문구와 상세페이지를 자동으로 만들 수 있습니다.',
    },
    {
        title: '주문과 배송 한 화면 관리',
        description: '들어온 주문, 송장 입력, 상품 상태 변경까지 한 곳에서 빠르게 처리할 수 있습니다.',
    },
];

export default function FarmerPage() {
    const [loading, setLoading] = useState(false);

    const handleKakaoLogin = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/farmer`,
            },
        });

        if (error) {
            alert(`카카오 로그인 중 오류가 발생했습니다: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '80vh', background: 'var(--background)' }}>
            <div className="container" style={{ maxWidth: '960px', display: 'grid', gap: '32px' }}>
                <section
                    style={{
                        background: 'linear-gradient(135deg, #173f2a 0%, #2f6a47 100%)',
                        padding: '48px',
                        borderRadius: 'var(--radius)',
                        color: 'white',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    <div style={{ maxWidth: '620px' }}>
                        <h1 style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
                            농가 판매를
                            <br />
                            더 쉽게 시작하세요
                        </h1>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, opacity: 0.92, marginBottom: '28px' }}>
                            앱팜 농가 센터는 처음 판매하는 분도 쉽게 쓸 수 있도록 만들었습니다.
                            카카오 로그인 후 농가 정보만 등록하면 바로 상품 등록과 주문 관리를 시작할 수 있습니다.
                        </p>

                        <button
                            disabled={loading}
                            onClick={() => void handleKakaoLogin()}
                            style={{
                                background: '#FEE500',
                                color: '#111111',
                                padding: '16px 26px',
                                borderRadius: '14px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                opacity: loading ? 0.7 : 1,
                            }}
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000" aria-hidden="true">
                                <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.85 1.83 5.34 4.57 6.74-.29 1.09-1.07 4.12-1.11 4.3-.06.27.14.3.29.2.14-.08 3.51-2.43 4.88-3.38.45.06.91.09 1.38.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                            </svg>
                            {loading ? '카카오 로그인 중입니다...' : '카카오로 시작하기'}
                        </button>
                    </div>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {benefitCards.map((card) => (
                        <article
                            key={card.title}
                            style={{
                                background: 'white',
                                padding: '28px',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        >
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{card.title}</h2>
                            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{card.description}</p>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
}
