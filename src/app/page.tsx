import Link from 'next/link';

export default function Home() {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'inline-block'
          }}>
            산지직송 강원도 고랭지 브랜드
          </span>
          <h1>강원의 싱그러움을 <br /> <span style={{ color: 'var(--primary-light)' }}>식탁까지 정직하게</span></h1>
          <p>
            불필요한 유통 마진을 덜어내고, 농민과 소비자가 직접 만나는 투명한 플랫폼.
            오늘 수확한 정선 고랭지 옥수수, 양배추, 배추를 산지 가격으로 만나보세요.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/products" className="btn-primary">
              상품 보러가기
            </Link>
            <Link href="/farmer/register" style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              border: '1px solid var(--primary)',
              color: 'var(--primary)'
            }}>
              농가 파트너 등록
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 0', background: 'var(--background)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Highland Fresh의 약속</h2>
            <p style={{ color: 'var(--muted)' }}>생산자와 소비자 모두가 웃을 수 있는 투명한 유통 구조를 만듭니다.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            <FeatureCard
              title="100% 산지직송"
              desc="복잡한 경매 절차 없이 산지에서 바로 배송되어 최고의 신선도를 보장합니다."
              icon="🥬"
            />
            <FeatureCard
              title="가격 투명성"
              desc="농가 수취액, 배송비, 플랫폼 수수료를 모두 공개하여 합리적인 소비를 돕습니다."
              icon="📊"
            />
            <FeatureCard
              title="AI 기반 데이터"
              desc="OpenAI 기술을 활용하여 최적의 가격 추천 및 수요 예측을 제공합니다."
              icon="🧠"
            />
          </div>
        </div>
      </section>

      {/* Product Highlight Section */}
      <section style={{ padding: '80px 0', background: 'var(--accent)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <h2 style={{ fontSize: '2rem' }}>지금 수확 중인 상품</h2>
              <p style={{ color: 'var(--muted)' }}>강원도 정선군 정선읍에서 갓 수확한 신선한 농산물입니다.</p>
            </div>
            <Link href="/products" style={{ color: 'var(--primary)', fontWeight: 600 }}>전체보기 →</Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Mock Products */}
            <ProductCard
              name="정선 아우라지 찰옥수수 10개입"
              price={15000}
              farm="여량면 찰옥수수농가"
              harvest="2026-02-12"
              img="https://placehold.co/600x400/1a4d2e/ffffff?text=Jeongseon+Corn"
            />
            <ProductCard
              name="아삭하고 달콤한 고랭지 양배추"
              price={5500}
              farm="임계면 푸른농원"
              harvest="2026-02-11"
              img="https://placehold.co/600x400/4f6f52/ffffff?text=Jeongseon+Green+Cabbage"
            />
            <ProductCard
              name="정선 정암산 고슬고슬 고랭지 배추"
              price={12500}
              farm="정선 정선농가"
              harvest="2026-02-10"
              img="https://placehold.co/600x400/1a4d2e/ffffff?text=Jeongseon+Napa+Cabbage"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <div style={{
      padding: '40px',
      borderRadius: 'var(--radius)',
      background: 'white',
      boxShadow: 'var(--shadow-md)',
      transition: 'transform 0.3s ease'
    }} className="feature-card">
      <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>{title}</h3>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function ProductCard({ name, price, farm, harvest, img }: any) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)'
    }}>
      <div style={{ width: '100%', height: '200px', background: '#eee', backgroundImage: `url(${img})`, backgroundSize: 'cover' }} />
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{farm}</p>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>{name}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{price.toLocaleString()}원</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>수확일: {harvest}</span>
        </div>
      </div>
    </div>
  );
}
