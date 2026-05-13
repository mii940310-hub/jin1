'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Farm = {
    id: string;
    name: string;
};

type OrderStatus = 'cancelled' | 'completed' | 'delivered' | 'paid' | 'pending' | 'preparing' | 'shipped' | string;

type Order = {
    created_at: string;
    id: string;
    status: OrderStatus;
    total_amount: number;
};

type Product = {
    farm_id: string;
    name: string;
    price_farmer: number;
};

type OrderItemRow = {
    order_id: string;
    quantity: number;
    orders: Order;
    products: Product;
};

type RecentOrderGroup = {
    items: OrderItemRow[];
    order: Order;
};

export default function FarmerDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [farm, setFarm] = useState<Farm | null>(null);
    const [stats, setStats] = useState({ revenue: 0, waitingOrders: 0, productsCount: 0 });
    const [recentOrders, setRecentOrders] = useState<RecentOrderGroup[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            const { data: farmData } = await supabase.from('farms').select('id, name').eq('owner_id', user.id).single();

            if (!farmData) {
                alert('먼저 농가 정보를 등록해 주세요.');
                router.push('/farmer/register');
                return;
            }

            setFarm(farmData as Farm);

            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('farm_id', farmData.id);

            const { data: orderItems } = await supabase
                .from('order_items')
                .select('order_id, quantity, orders(id, created_at, status, total_amount), products!inner(name, price_farmer, farm_id)')
                .eq('products.farm_id', farmData.id)
                .order('created_at', { ascending: false });

            const normalizedItems = (orderItems ?? []) as unknown as OrderItemRow[];
            const grouped = new Map<string, RecentOrderGroup>();
            let waitingOrders = 0;
            let revenue = 0;

            normalizedItems.forEach((item) => {
                revenue += item.products.price_farmer * item.quantity;

                if (!grouped.has(item.order_id)) {
                    grouped.set(item.order_id, {
                        items: [item],
                        order: item.orders,
                    });

                    if (item.orders.status === 'paid' || item.orders.status === 'preparing') {
                        waitingOrders += 1;
                    }
                } else {
                    grouped.get(item.order_id)?.items.push(item);
                }
            });

            setStats({
                revenue,
                waitingOrders,
                productsCount: productCount || 0,
            });
            setRecentOrders(Array.from(grouped.values()).slice(0, 5));
            setLoading(false);
        };

        void loadDashboard();
    }, [router]);

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>농가 관리 센터</h1>
                        <p style={{ color: 'var(--muted)' }}>{farm?.name}의 판매 현황입니다.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <Link className="btn-outline" href="/farmer/products">상품 관리</Link>
                        <Link
                            href="/farmer/auto-sell"
                            style={{
                                background: '#eef6f0',
                                border: '1px solid #b8d3bf',
                                borderRadius: '999px',
                                color: '#1f5132',
                                fontWeight: 700,
                                padding: '12px 18px',
                            }}
                        >
                            AI 초간편 등록
                        </Link>
                        <Link className="btn-primary" href="/farmer/register-product">새 상품 등록</Link>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '60px' }}>
                    <StatCard label="예상 정산 금액" value={`${stats.revenue.toLocaleString()}원`} />
                    <StatCard label="배송 준비 주문" value={`${stats.waitingOrders}건`} />
                    <StatCard label="등록 상품 수" value={`${stats.productsCount}개`} />
                </div>

                <section
                    style={{
                        display: 'grid',
                        gap: '20px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        marginBottom: '40px',
                    }}
                >
                    <div style={{ background: '#f6fbf7', border: '1px solid #d6e8d9', borderRadius: 'var(--radius)', padding: '24px' }}>
                        <div style={{ color: '#1f5132', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>QUICK START</div>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>AI 초간편 등록</h2>
                        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '18px' }}>
                            사진과 음성 설명만으로 상품 초안과 홍보 문구를 바로 만들 수 있습니다.
                        </p>
                        <Link className="btn-primary" href="/farmer/auto-sell">바로 시작하기</Link>
                    </div>

                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
                        <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>DETAIL MODE</div>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>상세 작성 모드</h2>
                        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '18px' }}>
                            가격과 FAQ, SNS 문구까지 함께 준비하면서 더 자세하게 등록할 수 있습니다.
                        </p>
                        <Link className="btn-outline" href="/farmer/register-product">상세 등록으로 이동</Link>
                    </div>
                </section>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>최근 주문</h2>
                        <Link href="/farmer/orders" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>전체 주문 보기</Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>아직 들어온 주문이 없습니다.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--accent)', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                    <th style={{ padding: '16px 24px' }}>주문번호</th>
                                    <th style={{ padding: '16px 24px' }}>상품</th>
                                    <th style={{ padding: '16px 24px' }}>총액</th>
                                    <th style={{ padding: '16px 24px' }}>상태</th>
                                    <th style={{ padding: '16px 24px' }}>주문일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((group) => (
                                    <OrderRow
                                        key={group.order.id}
                                        date={new Date(group.order.created_at).toLocaleDateString()}
                                        id={group.order.id}
                                        item={`${group.items[0]?.products.name || '상품 정보 없음'}${group.items.length > 1 ? ` 외 ${group.items.length - 1}건` : ''}`}
                                        price={`${group.order.total_amount.toLocaleString()}원`}
                                        status={group.order.status}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
        </div>
    );
}

function OrderRow({
    date,
    id,
    item,
    price,
    status,
}: {
    date: string;
    id: string;
    item: string;
    price: string;
    status: OrderStatus;
}) {
    const statusMap: Record<string, { color: string; label: string }> = {
        pending: { label: '결제 대기', color: '#f59e0b' },
        paid: { label: '결제 완료', color: '#3b82f6' },
        preparing: { label: '상품 준비중', color: '#f59e0b' },
        shipped: { label: '배송 중', color: '#10b981' },
        delivered: { label: '배송 완료', color: '#10b981' },
    };

    const displayStatus = statusMap[status] || { label: status, color: '#6b7280' };

    return (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{id.slice(0, 8)}...</td>
            <td style={{ padding: '16px 24px' }}>{item}</td>
            <td style={{ padding: '16px 24px' }}>{price}</td>
            <td style={{ padding: '16px 24px' }}>
                <span
                    style={{
                        background: `${displayStatus.color}22`,
                        color: displayStatus.color,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                    }}
                >
                    {displayStatus.label}
                </span>
            </td>
            <td style={{ padding: '16px 24px', color: 'var(--muted)' }}>{date}</td>
        </tr>
    );
}
