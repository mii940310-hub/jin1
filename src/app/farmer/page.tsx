import Link from 'next/link';

export default function FarmerDashboard() {
    return (
        <div className="fade-in" style={{ paddingTop: '100px' }}>
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>농가 관리 센터</h1>
                        <p style={{ color: 'var(--muted)' }}>정선 정선농가님의 판매 현황입니다.</p>
                    </div>
                    <Link href="/farmer/register-product" className="btn-primary">
                        + 신규 상품 등록
                    </Link>
                </header>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    marginBottom: '60px'
                }}>
                    <StatCard label="이번 달 판매액" value="4,250,000원" trend="+12%" />
                    <StatCard label="배송 대기" value="18건" />
                    <StatCard label="등록 상품" value="5개" />
                    <StatCard label="평균 별점" value="4.9/5.0" />
                </div>

                {/* Recent Orders */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem' }}>최근 주문 내역</h3>
                        <Link href="/farmer/orders" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>전체보기</Link>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--accent)', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                <th style={{ padding: '16px 24px' }}>주문번호</th>
                                <th style={{ padding: '16px 24px' }}>상품명</th>
                                <th style={{ padding: '16px 24px' }}>금액</th>
                                <th style={{ padding: '16px 24px' }}>상태</th>
                                <th style={{ padding: '16px 24px' }}>날짜</th>
                            </tr>
                        </thead>
                        <tbody>
                            <OrderRow id="ORD-2026-001" item="대관령 배추 10kg" price="45,000" status="배송중" date="2026-02-12" />
                            <OrderRow id="ORD-2026-002" item="강원 무 5kg" price="12,000" status="출하준비" date="2026-02-12" />
                            <OrderRow id="ORD-2026-003" item="대관령 배추 10kg" price="45,000" status="결제완료" date="2026-02-11" />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, trend }: any) {
    return (
        <div style={{ padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {value}
                {trend && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{trend}</span>}
            </div>
        </div>
    );
}

function OrderRow({ id, item, price, status, date }: any) {
    const statusColor = status === '배송중' ? '#3b82f6' : status === '출하준비' ? '#f59e0b' : '#10b981';
    return (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{id}</td>
            <td style={{ padding: '16px 24px' }}>{item}</td>
            <td style={{ padding: '16px 24px' }}>{price}원</td>
            <td style={{ padding: '16px 24px' }}>
                <span style={{
                    background: `${statusColor}22`,
                    color: statusColor,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}>{status}</span>
            </td>
            <td style={{ padding: '16px 24px', color: 'var(--muted)' }}>{date}</td>
        </tr>
    );
}
