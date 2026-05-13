'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type OrderStatus = 'paid' | 'preparing' | 'shipped' | 'delivered';

type OrderRecord = {
    courier_company: string | null;
    created_at: string;
    id: string;
    shipping_address: string | null;
    status: OrderStatus;
    tracking_number: string | null;
};

type ProductRecord = {
    image_url: string | null;
    name: string;
    price_farmer: number;
    weight_kg: number | null;
};

type OrderItemRecord = {
    id: string;
    order_id: string;
    orders: OrderRecord | OrderRecord[] | null;
    products: ProductRecord | ProductRecord[] | null;
    quantity: number;
};

type OrderGroup = {
    items: Array<{
        id: string;
        product: ProductRecord;
        quantity: number;
    }>;
    order: OrderRecord;
};

type TrackingState = Record<string, { courier: string; tracking: string }>;

function pickSingle<T>(value: T | T[] | null): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value;
}

export default function FarmerOrdersPage() {
    const [orders, setOrders] = useState<OrderGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [trackingInfo, setTrackingInfo] = useState<TrackingState>({});

    useEffect(() => {
        void fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setOrders([]);
                return;
            }

            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).maybeSingle();

            if (!farm) {
                setOrders([]);
                return;
            }

            const { data: orderItems, error } = await supabase
                .from('order_items')
                .select(`
                    id,
                    order_id,
                    quantity,
                    orders (
                        id,
                        created_at,
                        status,
                        shipping_address,
                        courier_company,
                        tracking_number
                    ),
                    products!inner (
                        name,
                        image_url,
                        price_farmer,
                        weight_kg,
                        farm_id
                    )
                `)
                .eq('products.farm_id', farm.id)
                .order('created_at', { ascending: false, referencedTable: 'orders' });

            if (error) {
                throw error;
            }

            const groups = new Map<string, OrderGroup>();

            for (const rawItem of (orderItems ?? []) as OrderItemRecord[]) {
                const order = pickSingle(rawItem.orders);
                const product = pickSingle(rawItem.products);

                if (!order || !product) {
                    continue;
                }

                const existingGroup = groups.get(rawItem.order_id);

                if (existingGroup) {
                    existingGroup.items.push({
                        id: rawItem.id,
                        product,
                        quantity: rawItem.quantity,
                    });
                    continue;
                }

                groups.set(rawItem.order_id, {
                    order,
                    items: [
                        {
                            id: rawItem.id,
                            product,
                            quantity: rawItem.quantity,
                        },
                    ],
                });
            }

            const nextOrders = Array.from(groups.values());
            const nextTrackingInfo: TrackingState = {};

            for (const group of nextOrders) {
                nextTrackingInfo[group.order.id] = {
                    courier: group.order.courier_company || 'kr.cjlogistics',
                    tracking: group.order.tracking_number || '',
                };
            }

            setOrders(nextOrders);
            setTrackingInfo(nextTrackingInfo);
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : '주문 정보를 불러오지 못했습니다.';
            alert(message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const updateTrackingField = (orderId: string, field: 'courier' | 'tracking', value: string) => {
        setTrackingInfo((previous) => ({
            ...previous,
            [orderId]: {
                courier: previous[orderId]?.courier || 'kr.cjlogistics',
                tracking: previous[orderId]?.tracking || '',
                [field]: value,
            },
        }));
    };

    const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
        setUpdatingOrderId(orderId);

        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

        if (error) {
            alert(`주문 상태 업데이트에 실패했습니다: ${error.message}`);
        } else {
            alert('주문 상태가 변경되었습니다.');
            await fetchOrders();
        }

        setUpdatingOrderId(null);
    };

    const handleSaveTracking = async (orderId: string) => {
        const tracking = trackingInfo[orderId];

        if (!tracking?.tracking.trim()) {
            alert('송장 번호를 입력해 주세요.');
            return;
        }

        setUpdatingOrderId(orderId);

        const { error } = await supabase
            .from('orders')
            .update({
                courier_company: tracking.courier,
                tracking_number: tracking.tracking,
                status: 'shipped',
            })
            .eq('id', orderId);

        if (error) {
            alert(`배송 정보 저장에 실패했습니다: ${error.message}`);
        } else {
            alert('배송 정보를 저장했고 주문 상태를 배송 중으로 변경했습니다.');
            await fetchOrders();
        }

        setUpdatingOrderId(null);
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem' }}>주문 / 배송 관리</h1>
                        <p style={{ color: 'var(--muted)', marginTop: '8px' }}>고객 주문을 확인하고 배송 상태와 송장 정보를 관리합니다.</p>
                    </div>
                </header>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        들어온 주문이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '32px' }}>
                        {orders.map((group) => (
                            <section key={group.order.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--accent)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, marginRight: '16px' }}>주문일자: {new Date(group.order.created_at).toLocaleDateString()}</span>
                                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>주문번호: {group.order.id.slice(0, 13)}...</span>
                                    </div>
                                    <select
                                        disabled={updatingOrderId === group.order.id}
                                        onChange={(event) => void handleUpdateStatus(group.order.id, event.target.value as OrderStatus)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, background: 'white', cursor: 'pointer' }}
                                        value={group.order.status}
                                    >
                                        <option value="paid">결제 완료</option>
                                        <option value="preparing">상품 준비중</option>
                                        <option value="shipped">배송 중</option>
                                        <option value="delivered">배송 완료</option>
                                    </select>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '300px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>배송지 정보</h4>
                                            <div style={{ color: '#475569', fontSize: '0.95rem' }}>{group.order.shipping_address || '주소 정보가 없습니다.'}</div>
                                        </div>

                                        <div style={{ flex: 1, minWidth: '300px', marginBottom: '20px', padding: '16px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#3730a3' }}>송장 입력</h4>
                                            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <select
                                                        onChange={(event) => updateTrackingField(group.order.id, 'courier', event.target.value)}
                                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #a5b4fc', outline: 'none' }}
                                                        value={trackingInfo[group.order.id]?.courier || 'kr.cjlogistics'}
                                                    >
                                                        <option value="kr.cjlogistics">CJ대한통운</option>
                                                        <option value="kr.epost">우체국택배</option>
                                                        <option value="kr.lotte">롯데택배</option>
                                                        <option value="kr.hanjin">한진택배</option>
                                                        <option value="kr.logen">로젠택배</option>
                                                    </select>
                                                    <input
                                                        onChange={(event) => updateTrackingField(group.order.id, 'tracking', event.target.value)}
                                                        placeholder="송장 번호 입력"
                                                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #a5b4fc', outline: 'none' }}
                                                        type="text"
                                                        value={trackingInfo[group.order.id]?.tracking || ''}
                                                    />
                                                </div>
                                                <button
                                                    disabled={updatingOrderId === group.order.id}
                                                    onClick={() => void handleSaveTracking(group.order.id)}
                                                    style={{ padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                                                    type="button"
                                                >
                                                    배송 정보 저장
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {group.items.map((item) => (
                                            <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        background: '#eee',
                                                        borderRadius: '8px',
                                                        backgroundImage: `url(${item.product.image_url || `https://placehold.co/120x120?text=${encodeURIComponent(item.product.name)}`})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                                                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                                                        {item.quantity}박스
                                                        {item.product.weight_kg ? ` · 박스당 ${item.product.weight_kg}kg` : ''}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 700 }}>
                                                    {(item.product.price_farmer * item.quantity).toLocaleString()}원
                                                    <br />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 400 }}>(농가 수익 기준)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
