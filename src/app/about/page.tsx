'use client';

import { useRouter } from 'next/navigation';

type InfoCardProps = {
    description: string;
    title: string;
};

const philosophyCards: InfoCardProps[] = [
    {
        description: '생산자가 가격과 상품 이야기를 직접 전달할 수 있도록 설계했습니다.',
        title: '농가 중심 직거래',
    },
    {
        description: '사진과 음성만으로 상품명, 소개글, 홍보 문구를 빠르게 만들어냅니다.',
        title: 'AI 자동화',
    },
    {
        description: '소비자는 상품 정보와 가격 구조를 쉽게 이해하고 선택할 수 있습니다.',
        title: '투명한 신뢰 구조',
    },
];

const featureCards: InfoCardProps[] = [
    {
        description: '상품 기본 정보와 농가 설명을 바탕으로 판매용 상세 설명을 자동으로 작성합니다.',
        title: 'AI 구매력 강화 상세 설명',
    },
    {
        description: '수확일, 보관법, 묶음 구성 같은 정보를 소비자가 이해하기 쉽게 정리합니다.',
        title: '판매 정보 자동 정리',
    },
    {
        description: '블로그 글, 카카오톡 문구, SNS용 문안을 한 번에 준비할 수 있습니다.',
        title: '홍보 문구 자동 생성',
    },
];

export default function AboutPage() {
    const router = useRouter();

    return (
        <div style={{ background: '#fafcfa', minHeight: '100vh', overflow: 'hidden' }}>
            <section
                style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    overflow: 'hidden',
                    padding: '160px 20px 100px',
                    position: 'relative',
                    textAlign: 'center',
                }}
            >
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)', height: '400px', left: '-10%', position: 'absolute', top: '-10%', width: '400px' }} />
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', bottom: '-20%', filter: 'blur(100px)', height: '600px', position: 'absolute', right: '-10%', width: '600px' }} />

                <div style={{ margin: '0 auto', maxWidth: '840px', position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '24px' }}>
                        농가와 소비자를 더 가깝게 잇는
                        <br />
                        직거래 플랫폼 숨팜
                    </h1>
                    <p style={{ fontSize: '1.25rem', lineHeight: 1.7, marginBottom: '40px', opacity: 0.92 }}>
                        숨팜은 생산자가 더 쉽게 판매를 시작하고,
                        <br />
                        소비자가 더 믿고 고를 수 있는 농산물 판매 경험을 만듭니다.
                    </p>
                    <button
                        onClick={() => router.push('/products')}
                        style={{ background: 'white', border: 'none', borderRadius: '30px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', color: '#059669', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 800, padding: '16px 40px' }}
                        type="button"
                    >
                        직거래 상품 둘러보기
                    </button>
                </div>
            </section>

            <section style={{ margin: '0 auto', maxWidth: '1000px', padding: '100px 20px' }}>
                <div style={{ marginBottom: '60px', textAlign: 'center' }}>
                    <h2 style={{ color: '#1e293b', fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>우리가 만드는 방향</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                        직거래의 장점은 살리고, 판매 준비의 부담은 줄이는 것이 목표입니다.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {philosophyCards.map((card) => (
                        <InfoCard key={card.title} description={card.description} title={card.title} />
                    ))}
                </div>
            </section>

            <section style={{ background: 'white', borderBottom: '1px solid #f1f5f9', borderTop: '1px solid #f1f5f9', padding: '100px 20px' }}>
                <div style={{ margin: '0 auto', maxWidth: '1000px' }}>
                    <h2 style={{ color: '#0f172a', fontSize: '2.2rem', fontWeight: 800, marginBottom: '40px', textAlign: 'center' }}>
                        숨팜의 핵심 AI 기술
                    </h2>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        {featureCards.map((card) => (
                            <FeatureRow key={card.title} description={card.description} title={card.title} />
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ background: '#ecfdf5', padding: '100px 20px', textAlign: 'center' }}>
                <h2 style={{ color: '#065f46', fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px' }}>
                    지금 바로 직거래 판매를 시작해 보세요.
                </h2>
                <p style={{ color: '#166534', fontSize: '1.2rem', marginBottom: '40px' }}>
                    불안정한 가격 실험보다, 실제 판매가 쉬워지는 자동화에 집중했습니다.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                    <button
                        onClick={() => router.push('/products')}
                        style={{ background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, padding: '16px 32px' }}
                        type="button"
                    >
                        상품 둘러보기
                    </button>
                    <button
                        onClick={() => router.push('/farmer')}
                        style={{ background: 'white', border: '2px solid #10b981', borderRadius: '12px', color: '#10b981', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, padding: '16px 32px' }}
                        type="button"
                    >
                        농가 입점하기
                    </button>
                </div>
            </section>
        </div>
    );
}

function InfoCard({ description, title }: InfoCardProps) {
    return (
        <div
            style={{
                background: 'white',
                border: '1px solid #f8fafc',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                padding: '40px 30px',
            }}
        >
            <h3 style={{ color: '#1e293b', fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>{title}</h3>
            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7 }}>{description}</p>
        </div>
    );
}

function FeatureRow({ description, title }: InfoCardProps) {
    return (
        <div
            style={{
                alignItems: 'flex-start',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                display: 'flex',
                gap: '24px',
                padding: '30px',
            }}
        >
            <div
                style={{
                    alignItems: 'center',
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    color: '#10b981',
                    display: 'flex',
                    flexShrink: 0,
                    fontSize: '1rem',
                    fontWeight: 800,
                    height: '80px',
                    justifyContent: 'center',
                    width: '80px',
                }}
            >
                AI
            </div>
            <div>
                <h3 style={{ color: '#334155', fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>{title}</h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>{description}</p>
            </div>
        </div>
    );
}
