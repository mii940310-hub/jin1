'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function FarmerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);
    const [trackingInfo, setTrackingInfo] = useState<Record<string, { courier: string, tracking: string }>>({});

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();
        if (farm) {
            // Fetch all order_items that belong to this farm's products
            const { data: orderItems, error } = await supabase
                .from('order_items')
                .select(`
                    *,
                    orders (*),
                    products!inner (*)
                `)
                .eq('products.farm_id', farm.id)
                .order('created_at', { ascending: false });

            if (!error && orderItems) {
                const uniqueOrders = new Map();
                orderItems.forEach((item: any) => {
                    const oId = item.order_id;
                    if (!uniqueOrders.has(oId)) {
                        uniqueOrders.set(oId, {
                            order: item.orders,
                            items: [item]
                        });
                    } else {
                        uniqueOrders.get(oId).items.push(item);
                    }
                });

                const ordersArray = Array.from(uniqueOrders.values());
                setOrders(ordersArray);

                const initialTracking: Record<string, { courier: string, tracking: string }> = {};
                ordersArray.forEach((group: any) => {
                    initialTracking[group.order.id] = {
                        courier: group.order.courier_company || 'kr.cjlogistics',
                        tracking: group.order.tracking_number || ''
                    };
                });
                setTrackingInfo(initialTracking);
            }
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingParams(orderId);
        
        let updateData: any = { status: newStatus };
        
        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) {
            alert('상태 업데이트 실패: ' + error.message);
        } else {
            alert('주문 상태가 변경되었습니다.');
            await fetchOrders();
        }
        setUpdatingParams(null);
    };

    const handleSaveTracking = async (orderId: string) => {
        if (!trackingInfo[orderId].tracking.trim()) {
            alert('운송장 번호를 입력해주세요.');
            return;
        }

        setUpdatingParams(orderId);
        
        const { error } = await supabase
            .from('orders')
            .update({
                courier_company: trackingInfo[orderId].courier,
                tracking_number: trackingInfo[orderId].tracking,
                status: 'shipped' // 자동으로 배송중으로 상태 변경
            })
            .eq('id', orderId);

        if (error) {
            alert('택배 정보 저장 실패: ' + error.message);
        } else {
            alert('택배 정보가 저장되었고, 상태가 [배송중]으로 변경되었습니다.');
            await fetchOrders();
        }
        setUpdatingParams(null);
    };

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem' }}>주문 / 배송 관리</h1>
                        <p style={{ color: 'var(--muted)', marginTop: '8px' }}>고객이 결제한 나의 농산물 주문을 확인하고 택배 정보를 입력하세요.</p>
                    </div>
                </header>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        들어온 주문이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '32px' }}>
                        {orders.map((group: any) => (
                            <div key={group.order.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--accent)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, marginRight: '16px' }}>주문일자: {new Date(group.order.created_at).toLocaleDateString()}</span>
                                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>주문번호: {group.order.id.slice(0, 13)}...</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <select
                                            value={group.order.status}
                                            onChange={(e) => handleUpdateStatus(group.order.id, e.target.value)}
                                            disabled={updatingParams === group.order.id}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                fontWeight: 600,
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="paid">결제완료 (배송준비요청)</option>
                                            <option value="preparing">상품준비중</option>
                                            <option value="shipped">배송중</option>
                                            <option value="delivered">배송완료</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '300px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>배송지 정보</h4>
                                            <div style={{ color: '#475569', fontSize: '0.95rem' }}>{group.order.shipping_address}</div>
                                        </div>
                                        
                                        {/* 택배 정보 입력 박스 */}
                                        <div style={{ flex: 1, minWidth: '300px', marginBottom: '20px', padding: '16px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#3730a3' }}>택배 발송 처리</h4>
                                            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <select 
                                                        value={trackingInfo[group.order.id]?.courier || 'kr.cjlogistics'}
                                                        onChange={(e) => setTrackingInfo({...trackingInfo, [group.order.id]: { ...trackingInfo[group.order.id], courier: e.target.value }})}
                                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #a5b4fc', outline: 'none' }}
                                                    >
                                                        <option value="kr.cjlogistics">CJ대한통운</option>
                                                        <option value="kr.epost">우체국택배</option>
                                                        <option value="kr.lotte">롯데택배</option>
                                                        <option value="kr.hanjin">한진택배</option>
                                                        <option value="kr.logen">로젠택배</option>
                                                    </select>
                                                    <input 
                                                        type="text" 
                                                        placeholder="송장번호 입력 (- 제외)" 
                                                        value={trackingInfo[group.order.id]?.tracking || ''}
                                                        onChange={(e) => setTrackingInfo({...trackingInfo, [group.order.id]: { ...trackingInfo[group.order.id], tracking: e.target.value }})}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #a5b4fc', outline: 'none' }}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => handleSaveTracking(group.order.id)}
                                                    disabled={updatingParams === group.order.id}
                                                    style={{ padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    발송 완료 (저장)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {group.items.map((item: any) => (
                                            <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ width: '60px', height: '60px', background: '#eee', borderRadius: '8px', backgroundImage: `url(${item.products.image_url})`, backgroundSize: 'cover' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600 }}>{item.products.name}</div>
                                                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{item.quantity}박스 (박스당 {item.products.weight_kg}kg)</div>
                                                </div>
                                                <div style={{ fontWeight: 700 }}>
                                                    {(item.products.price_farmer * item.quantity).toLocaleString()}원 <br/>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 400 }}>(나의 순수익 합계)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
