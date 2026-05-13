'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | string;
type OrderProduct = { name: string | null };
type OrderItem = { quantity: number; products: OrderProduct | null };
type OrderProfile = { email: string | null; full_name: string | null };
type AdminOrder = {
    created_at: string;
    id: string;
    order_items: OrderItem[] | null;
    status: OrderStatus | null;
    total_amount: number;
    user: OrderProfile | null;
};

export default function OrdersMonitorPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadInitialOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(
                    `
                    id,
                    created_at,
                    total_amount,
                    status,
                    user:profiles(full_name, email),
                    order_items (
                        quantity,
                        products (name)
                    )
                `,
                )
                .order('created_at', { ascending: false });

            if (!active) {
                return;
            }

            if (error) {
                console.error('Orders fetch error:', error);
            } else {
                setOrders((data ?? []) as unknown as AdminOrder[]);
            }

            setLoading(false);
        };

        void loadInitialOrders();

        return () => {
            active = false;
        };
    }, []);

    const translateStatus = (status: OrderStatus | null) => {
        switch (status) {
            case 'pending':
                return { label: '결제 대기', bg: '#fef3c7', text: '#d97706' };
            case 'paid':
                return { label: '결제 완료', bg: '#dbeafe', text: '#2563eb' };
            case 'preparing':
                return { label: '상품 준비 중', bg: '#fff7ed', text: '#ea580c' };
            case 'shipped':
                return { label: '배송 중', bg: '#dcfce7', text: '#16a34a' };
            case 'delivered':
                return { label: '배송 완료', bg: '#ecfccb', text: '#4d7c0f' };
            case 'cancelled':
                return { label: '주문 취소', bg: '#fee2e2', text: '#dc2626' };
            default:
                return { label: status || '상태 없음', bg: '#f1f5f9', text: '#475569' };
        }
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem' }}>전체 주문 모니터링</h1>
                    <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
                        결제 상태와 주문 상품을 한눈에 확인할 수 있습니다.
                    </p>
                </header>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--accent)', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                <th style={{ padding: '16px 24px' }}>주문일 / 번호</th>
                                <th style={{ padding: '16px 24px' }}>주문 고객</th>
                                <th style={{ padding: '16px 24px' }}>상품 목록</th>
                                <th style={{ padding: '16px 24px' }}>결제 금액</th>
                                <th style={{ padding: '16px 24px' }}>진행 상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                                        주문 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const status = translateStatus(order.status);
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 600 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                                                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{order.id.slice(0, 8)}...</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 600 }}>{order.user?.full_name || '이름 없음'}</div>
                                                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{order.user?.email || '-'}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {order.order_items && order.order_items.length > 0 ? (
                                                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                        {order.order_items.map((item, index) => (
                                                            <div key={`${order.id}-${index}`}>
                                                                {item.products?.name || '상품 정보 없음'}{' '}
                                                                <span style={{ color: 'var(--muted)' }}>({item.quantity}개)</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--muted)' }}>상품 정보 없음</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 700 }}>{order.total_amount.toLocaleString()}원</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span
                                                    style={{
                                                        background: status.bg,
                                                        color: status.text,
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'inline-block',
                                                    }}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
