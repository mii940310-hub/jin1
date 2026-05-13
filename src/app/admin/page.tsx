'use client';

import Link from 'next/link';

type DashboardCardProps = {
    description: string;
    href: string;
    icon: string;
    title: string;
};

const dashboardCards: DashboardCardProps[] = [
    {
        description: '전체 사용자 관리와 농가 가입 승인 요청 검토를 진행합니다.',
        href: '/admin/users',
        icon: '관리',
        title: '회원 및 농가 관리',
    },
    {
        description: '주문 상태와 배송 흐름을 한 화면에서 확인합니다.',
        href: '/admin/orders',
        icon: '주문',
        title: '전체 주문 모니터링',
    },
    {
        description: '기본 수수료율과 정산 규칙을 운영 정책에 맞게 조정합니다.',
        href: '/admin/fees',
        icon: '정산',
        title: '플랫폼 수수료 관리',
    },
];

export default function AdminDashboard() {
    return (
        <div className="fade-in" style={{ paddingBottom: '100px', paddingTop: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>통합 관리자 대시보드</h1>
                    <p style={{ color: 'var(--muted)' }}>
                        지금은 운영에 꼭 필요한 관리 기능만 남겨두고 가격은 검증 가능한 기준으로 운영합니다.
                    </p>
                </header>

                <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {dashboardCards.map((card) => (
                        <DashboardCard
                            key={card.href}
                            description={card.description}
                            href={card.href}
                            icon={card.icon}
                            title={card.title}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ description, href, icon, title }: DashboardCardProps) {
    return (
        <Link href={href} style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}>
            <div
                onMouseOut={(event) => {
                    event.currentTarget.style.boxShadow = 'none';
                    event.currentTarget.style.transform = 'none';
                }}
                onMouseOver={(event) => {
                    event.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    event.currentTarget.style.transform = 'translateY(-4px)';
                }}
                style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: '32px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
            >
                <div style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>{icon}</div>
                <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', marginBottom: '12px' }}>{title}</h2>
                <p style={{ color: 'var(--muted)', flex: 1, lineHeight: 1.5 }}>{description}</p>
                <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '24px' }}>관리하러 가기</div>
            </div>
        </Link>
    );
}
