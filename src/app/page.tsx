'use client';

import Image from 'next/image';
import Link from 'next/link';

const serviceCards = [
    {
        description: '오늘 수확한 농산물을 가능한 빠르게 출고합니다.',
        icon: '산지',
        title: '100% 산지 직송',
    },
    {
        description: '농가 가격, 물류비, 수수료 구조를 이해하기 쉽게 보여줍니다.',
        icon: '투명',
        title: '가격 구조 공개',
    },
    {
        description: '판매자가 사진과 음성만으로 상품 등록을 마칠 수 있게 돕습니다.',
        icon: '간편',
        title: '초간단 등록',
    },
    {
        description: 'AI는 설명 작성과 홍보 자동화에만 집중하고 가격은 안정적으로 운영합니다.',
        icon: '신뢰',
        title: '신뢰 우선 운영',
    },
];

const featuredProducts = [
    {
        farm: '고랭지 햇살농장',
        image: '/corn.png',
        name: '신선한 초당옥수수 10개입',
        origin: '강원도 고랭지',
        price: 15000,
    },
    {
        farm: '하늘배추농장',
        image: '/cabbage.png',
        name: '고랭지 절임배추 1망',
        origin: '강원도 고랭지',
        price: 12500,
    },
    {
        farm: '청선 배추농장',
        image: '/napa_cabbage.png',
        name: '아삭한 고랭지 배추',
        origin: '강원도 고랭지',
        price: 18900,
    },
];

export default function Home() {
    return (
        <div className="fade-in">
            <section
                className="hero"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("/hero.png")',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    color: 'white',
                    padding: '180px 0 120px',
                }}
            >
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <span
                        style={{
                            background: 'var(--primary)',
                            borderRadius: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            color: 'white',
                            display: 'inline-block',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            marginBottom: '24px',
                            padding: '8px 20px',
                        }}
                    >
                        농가를 위한 쉬운 판매 도구
                    </span>
                    <h1 style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                        농가에서 바로 보내는
                        <br />
                        <span style={{ color: '#c0ffcf' }}>신선한 직거래 플랫폼</span>
                    </h1>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
                        <Link className="btn-primary" href="/products" style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
                            상품 보러 가기
                        </Link>
                        <Link
                            className="btn-outline"
                            href="/farmer/register"
                            style={{
                                background: 'rgba(255,255,255,0.96)',
                                border: '2px solid rgba(26, 77, 46, 0.75)',
                                boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
                                color: 'var(--primary)',
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                padding: '16px 40px',
                            }}
                        >
                            농가 등록하기
                        </Link>
                    </div>
                </div>
            </section>

            <section id="about" style={{ background: 'white', padding: '100px 0' }}>
                <div className="container">
                    <div
                        style={{
                            alignItems: 'center',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '60px',
                        }}
                    >
                        <div style={{ flex: '1', minWidth: '300px' }}>
                            <h2 style={{ fontSize: '2.5rem', lineHeight: '1.3', marginBottom: '24px' }}>
                                생산자와 소비자를
                                <br />
                                <span style={{ color: 'var(--primary)' }}>가장 짧게 잇는 플랫폼</span>
                            </h2>
                            <div style={{ background: 'var(--accent)', borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius)', padding: '32px' }}>
                                <p style={{ color: 'var(--foreground)', fontSize: '1.1rem', lineHeight: '1.8', margin: 0 }}>
                                    숨팜은 고랭지 농산물을 농가에서 소비자에게 직접 연결하는 직거래 플랫폼입니다.
                                    <br />
                                    가격을 흔드는 실험보다, 설명을 쉽게 만들고 판매를 덜 어렵게 만드는 데 집중합니다.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', flex: '1', gap: '20px', gridTemplateColumns: '1fr 1fr', minWidth: '300px' }}>
                            {serviceCards.map((card) => (
                                <div key={card.title} style={{ background: card.title === '100% 산지 직송' || card.title === '신뢰 우선 운영' ? '#f0f7f2' : '#f5f5f5', borderRadius: 'var(--radius)', padding: '30px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px' }}>{card.icon}</div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{card.title}</h3>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{card.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section style={{ background: 'var(--accent)', padding: '100px 0' }}>
                <div className="container">
                    <div style={{ marginBottom: '60px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>오늘의 추천 산지 상품</h2>
                        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
                            고랭지 농가가 직접 올린 신선한 상품을 둘러보세요.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gap: '32px',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        }}
                    >
                        {featuredProducts.map((product) => (
                            <ProductCard
                                key={product.name}
                                farm={product.farm}
                                image={product.image}
                                name={product.name}
                                origin={product.origin}
                                price={product.price}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ background: 'var(--primary)', color: 'white', padding: '120px 0', textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '3rem', marginBottom: '24px' }}>신선한 농산물을 더 쉽게 만나보세요</h2>
                    <p style={{ fontSize: '1.25rem', marginBottom: '48px', opacity: 0.9 }}>
                        가격의 흔들림보다 상품의 품질과 판매 경험을 먼저 바로잡았습니다.
                    </p>
                    <Link
                        className="btn-hover-scale"
                        href="/products"
                        style={{
                            background: 'white',
                            borderRadius: '40px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            color: 'var(--primary)',
                            display: 'inline-block',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            padding: '20px 60px',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        상품 바로 보러가기
                    </Link>
                </div>
            </section>

            <style jsx>{`
                .btn-hover-scale:hover {
                    transform: scale(1.05);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    );
}

function ProductCard({ name, price, farm, origin, image }: { name: string; price: number; farm: string; origin: string; image: string }) {
    return (
        <div
            className="product-card-hover"
            style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
            }}
        >
            <div style={{ height: '240px', position: 'relative', width: '100%' }}>
                <Image alt={name} fill src={image} style={{ objectFit: 'cover' }} />
                <div
                    style={{
                        backdropFilter: 'blur(4px)',
                        background: 'rgba(26, 77, 46, 0.9)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        left: '16px',
                        padding: '6px 12px',
                        position: 'absolute',
                        top: '16px',
                    }}
                >
                    직거래 인증 농가
                </div>
            </div>
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: '#f0f0f0', borderRadius: '4px', color: '#666', fontSize: '0.75rem', padding: '4px 8px' }}>{origin}</span>
                    <span style={{ background: '#eefef1', borderRadius: '4px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px' }}>{farm}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>{name}</h3>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700 }}>{price.toLocaleString()}원</span>
                    <Link href="/products" style={{ borderBottom: '1px solid #ccc', color: 'var(--muted)', fontSize: '0.9rem' }}>상세보기</Link>
                </div>
            </div>
        </div>
    );
}
