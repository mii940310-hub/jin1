'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AuthUser = {
    id: string;
};

type Product = {
    image_url: string | null;
    name: string | null;
};

type OrderItem = {
    id: string;
    products: Product | null;
    quantity: number;
    total_price: number;
    unit_price: number;
};

type Order = {
    created_at: string;
    id: string;
    order_items: OrderItem[] | null;
    status: string;
    total_amount: number;
    tracking_number?: string | null;
    courier_company?: string | null;
};

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const loadOrders = async () => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();
            setUser(authUser ? { id: authUser.id } : null);

            if (authUser) {
                const { data: myOrders, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            id,
                            quantity,
                            unit_price,
                            total_price,
                            products (*)
                        )
                    `)
                    .eq('user_id', authUser.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('주문 내역 불러오기 실패:', error);
                } else {
                    setOrders((myOrders ?? []) as unknown as Order[]);
                }
            }

            setLoading(false);
        };

        void loadOrders();
    }, []);

    const translateStatus = (status: string) => {
        switch (status) {
            case 'pending':
                return '결제 대기';
            case 'paid':
                return '결제 완료';
            case 'preparing':
                return '상품 준비 중';
            case 'shipped':
                return '배송 중';
            case 'delivered':
                return '배송 완료';
            case 'completed':
                return '구매 확정';
            case 'cancelled':
                return '주문 취소';
            default:
                return status;
        }
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>주문 내역을 불러오는 중입니다...</div>;
    }

    if (!user) {
        return (
            <div className="container" style={{ paddingTop: '150px' }}>
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--accent)', borderRadius: 'var(--radius)' }}>
                    <h2>로그인이 필요합니다</h2>
                    <p style={{ margin: '16px 0 24px', color: 'var(--muted)' }}>주문 내역을 보려면 로그인해 주세요.</p>
                    <Link className="btn-primary" href="/login">로그인하러 가기</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingTop: '120px' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>나의 주문 내역</h1>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        주문 내역이 없습니다.
                        <div style={{ marginTop: '20px' }}>
                            <Link className="btn-primary" href="/products" style={{ padding: '10px 20px' }}>상품 둘러보기</Link>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                style={{
                                    background: 'white',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    padding: '24px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, marginRight: '16px' }}>주문일자: {new Date(order.created_at).toLocaleDateString()}</span>
                                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>주문번호: {order.id.slice(0, 8)}...</span>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{translateStatus(order.status)}</div>
                                </div>

                                {order.tracking_number && order.courier_company ? (
                                    <div style={{ marginBottom: '20px', background: '#eef2ff', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: '0.95rem', color: '#4f46e5' }}>
                                            <span style={{ fontWeight: 700 }}>운송장 번호:</span> {order.tracking_number}
                                        </div>
                                        <a
                                            href={`https://tracker.delivery/#/${order.courier_company}/${order.tracking_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-outline"
                                            style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: '#4f46e5', color: '#4f46e5', background: 'white' }}
                                        >
                                            배송 조회
                                        </a>
                                    </div>
                                ) : null}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {order.order_items?.map((item) => (
                                        <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    background: '#eee',
                                                    borderRadius: '8px',
                                                    backgroundImage: `url(${item.products?.image_url || `https://placehold.co/100x100?text=${encodeURIComponent(item.products?.name || '상품')}`})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{item.products?.name || '상품 정보 없음'}</h2>
                                                <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                                                    {item.unit_price.toLocaleString()}원 × {item.quantity}개
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.total_price.toLocaleString()}원</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', fontSize: '1.2rem' }}>
                                    <span style={{ marginRight: '16px' }}>총 결제 금액:</span>
                                    <span style={{ fontWeight: 800 }}>{order.total_amount.toLocaleString()}원</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
