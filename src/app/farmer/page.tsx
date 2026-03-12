'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FarmerDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [farm, setFarm] = useState<any>(null);
    const [stats, setStats] = useState({ revenue: 0, waitingOrders: 0, productsCount: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        async function loadDashboard() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            const { data: farmData } = await supabase.from('farms').select('*').eq('owner_id', user.id).single();
            if (farmData) {
                setFarm(farmData);

                // Fetch Products Count
                const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('farm_id', farmData.id);

                // Fetch orders related to this farm's products
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select('*, orders(*), products!inner(*)')
                    .eq('products.farm_id', farmData.id)
                    .order('created_at', { ascending: false });

                if (orderItems) {
                    const uniqueOrders = new Map();
                    let waitingCount = 0;
                    let totalRevenue = 0;

                    orderItems.forEach((item: any) => {
                        const oId = item.order_id;
                        totalRevenue += (item.products.price_farmer * item.quantity); // Calculate Farm Revenue
                        
                        if (!uniqueOrders.has(oId)) {
                            uniqueOrders.set(oId, {
                                order: item.orders,
                                items: [item]
                            });
                            // Count waiting orders based on order status
                            if (item.orders.status === 'paid' || item.orders.status === 'preparing') {
                                waitingCount++;
                            }
                        } else {
                            uniqueOrders.get(oId).items.push(item);
                        }
                    });

                    setStats({
                        revenue: totalRevenue,
                        waitingOrders: waitingCount,
                        productsCount: prodCount || 0
                    });

                    // Array of unique orders for recent list
                    setRecentOrders(Array.from(uniqueOrders.values()).slice(0, 5)); // top 5
                }
            } else {
                alert('등록된 농가가 없습니다. 농가 가입을 먼저 진행해주세요.');
                router.push('/farmer/register');
                return;
            }

            setLoading(false);
        }
        loadDashboard();
    }, [router]);

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>농가 관리 센터</h1>
                        <p style={{ color: 'var(--muted)' }}>{farm.name}님의 판매 현황입니다.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link href="/farmer/products" className="btn-outline">+ 상품 관리</Link>
                        <Link href="/farmer/register-product" className="btn-primary">+ 신규 상품 등록</Link>
                    </div>
                </header>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '60px' }}>
                    <StatCard label="총 누적 예상 수익액" value={`${stats.revenue.toLocaleString()}원`} />
                    <StatCard label="배송/준비 대기" value={`${stats.waitingOrders}건`} />
                    <StatCard label="현재 등록 상품" value={`${stats.productsCount}개`} />
                </div>

                {/* Recent Orders */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem' }}>최근 들어온 주문</h3>
                        <Link href="/farmer/orders" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>주문/배송 전체관리</Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>아직 들어온 주문이 없습니다.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--accent)', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                    <th style={{ padding: '16px 24px' }}>주문번호</th>
                                    <th style={{ padding: '16px 24px' }}>상품 (첫 품목 기준)</th>
                                    <th style={{ padding: '16px 24px' }}>총계</th>
                                    <th style={{ padding: '16px 24px' }}>주문상태</th>
                                    <th style={{ padding: '16px 24px' }}>주문일자</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((group: any) => (
                                    <OrderRow 
                                        key={group.order.id}
                                        id={group.order.id} 
                                        item={`${group.items[0].products.name} ${group.items.length > 1 ? `외 ${group.items.length - 1}건` : ''}`} 
                                        price={group.order.total_amount.toLocaleString()} 
                                        status={group.order.status} 
                                        date={new Date(group.order.created_at).toLocaleDateString()} 
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

function StatCard({ label, value }: any) {
    return (
        <div style={{ padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
        </div>
    );
}

function OrderRow({ id, item, price, status, date }: any) {
    const statusMap: any = {
        'pending': { label: '결제대기', color: '#f59e0b' },
        'paid': { label: '결제완료', color: '#3b82f6' },
        'preparing': { label: '상품준비중', color: '#f59e0b' },
        'shipped': { label: '배송중', color: '#10b981' },
        'delivered': { label: '배송완료', color: '#10b981' },
    };
    
    const displayStatus = statusMap[status] || { label: status, color: '#6b7280' };

    return (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{id.slice(0, 8)}...</td>
            <td style={{ padding: '16px 24px' }}>{item}</td>
            <td style={{ padding: '16px 24px' }}>{price}원</td>
            <td style={{ padding: '16px 24px' }}>
                <span style={{
                    background: `${displayStatus.color}22`,
                    color: displayStatus.color,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}>{displayStatus.label}</span>
            </td>
            <td style={{ padding: '16px 24px', color: 'var(--muted)' }}>{date}</td>
        </tr>
    );
}
