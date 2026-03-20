'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero" style={{ 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/hero.png")', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        color: 'white',
        padding: '180px 0 120px'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '24px',
            display: 'inline-block',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            직거래의 새로운 기준, 슝팜
          </span>
          <h1 style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            농가에서 바로 오는 <br /> <span style={{ color: '#c0ffcf' }}>진짜 신선함, 슝팜</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.4rem' }}>
            AI가 추천하는 합리적인 가격으로 농산물을 만나보세요
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
            <Link href="/products" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
              슝팜 상품 보러가기
            </Link>
          </div>
        </div>
      </section>

      {/* Service Description Section */}
      <section id="about" style={{ padding: '100px 0', background: 'white' }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '60px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', lineHeight: '1.3' }}>
                생산자와 소비자를 <br />
                <span style={{ color: 'var(--primary)' }}>가장 빠르게 잇는 슝팜</span>
              </h2>
              <div style={{ background: 'var(--accent)', padding: '32px', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '1.15rem', color: 'var(--foreground)', lineHeight: '1.8', margin: 0 }}>
                  “슝팜은 고랭지 농산물을 농가에서 소비자에게 직접 연결하는 직거래 플랫폼입니다. <br />
                  중간 유통 없이 신선도와 가격 투명성을 제공합니다.”
                </p>
              </div>
            </div>
            <div style={{ flex: '1', minWidth: '300px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#f0f7f2', padding: '30px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🥬</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>100% 산지직송</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>오늘 수확, 내일 도착</p>
              </div>
              <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💎</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>가격 투명성</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>유통 거품을 걷어낸 가격</p>
              </div>
              <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🤝</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>신뢰 기반</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>슝팜 인증 고랭지 농가</p>
              </div>
              <div style={{ background: '#f0f7f2', padding: '30px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🤖</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>AI 추천가</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>합리적인 데이터 매칭</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section style={{ padding: '100px 0', background: 'var(--accent)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>오늘의 슝팜 추천 농산물</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>강원도 고랭지에서 갓 수확한 신선함을 경험해보세요.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '32px'
          }}>
            <ProductCard
              name="정선 아우라지 찰옥수수 (10개입)"
              price={15000}
              origin="강원도 고랭지"
              farm="여량면 대박농원"
              img="/corn.png"
            />
            <ProductCard
              name="아삭한 고랭지 양배추 (1망/3수)"
              price={12500}
              origin="강원도 고랭지"
              farm="임계면 하늘농장"
              img="/cabbage.png"
            />
            <ProductCard
              name="정암산 고슬고슬 고랭지 배추"
              price={18900}
              origin="강원도 고랭지"
              farm="정선 정선농가"
              img="/napa_cabbage.png"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '120px 0', textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
        <div className="container">
          <h2 style={{ fontSize: '3rem', marginBottom: '24px' }}>가장 신선한 농산물을 만나는 법</h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '48px', opacity: 0.9 }}>지금 바로 슝팜에서 건강한 식탁을 준비하세요.</p>
          <Link href="/products" style={{ 
            background: 'white', 
            color: 'var(--primary)', 
            padding: '20px 60px', 
            borderRadius: '40px', 
            fontSize: '1.25rem', 
            fontWeight: 700,
            display: 'inline-block',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }} className="btn-hover-scale">
            슝팜에서 바로 구매하기
          </Link>
        </div>
      </section>

      <style jsx>{`
        .btn-hover-scale:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

function ProductCard({ name, price, farm, origin, img }: { name: string, price: number, farm: string, origin: string, img: string }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
      border: '1px solid var(--border)',
      transition: 'all 0.3s ease'
    }} className="product-card-hover">
      <div style={{ position: 'relative', width: '100%', height: '240px' }}>
        <Image src={img} alt={name} fill style={{ objectFit: 'cover' }} />
        <div style={{ 
          position: 'absolute', 
          top: '16px', 
          left: '16px', 
          background: 'rgba(26, 77, 46, 0.9)', 
          color: 'white', 
          padding: '6px 12px', 
          borderRadius: '6px', 
          fontSize: '0.75rem', 
          fontWeight: 700,
          backdropFilter: 'blur(4px)'
        }}>
          슝팜 인증 농가
        </div>
      </div>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', color: '#666' }}>{origin}</span>
          <span style={{ fontSize: '0.75rem', background: '#eefef1', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)', fontWeight: 600 }}>{farm}</span>
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', fontWeight: 600 }}>{name}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{price.toLocaleString()}원</span>
          <Link href="/products" style={{ color: 'var(--muted)', fontSize: '0.9rem', borderBottom: '1px solid #ccc' }}>상세보기</Link>
        </div>
      </div>
    </div>
  );
}

