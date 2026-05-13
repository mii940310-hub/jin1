'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as PortOne from '@portone/browser-sdk/v2';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const portoneStoreId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const portoneChannelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

type CartItemProduct = {
    category?: string | null;
    image_url?: string | null;
    name: string;
    price_logistics?: number | null;
    price_per_kg?: number | null;
    price_total: number;
    weight_kg?: number | null;
    weight_options?: Array<{ weight: number }> | null;
    weight_type?: 'fixed' | 'range' | 'variable' | null;
    weight_unit?: string | null;
    min_weight?: number | null;
    max_weight?: number | null;
};

type CartItemMetadata = {
    ai_discount?: number;
    selected_option_index?: number;
    weight_type?: 'fixed' | 'range' | 'variable';
};

type CartItem = {
    id: string;
    metadata?: CartItemMetadata | null;
    products: CartItemProduct;
};

export default function CartPage() {
    const router = useRouter();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isRemoteArea, setIsRemoteArea] = useState(false);

    useEffect(() => {
        const loadCart = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();

                if (cart) {
                    const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('cart_id', cart.id);
                    setItems((cartItems || []) as CartItem[]);
                }
            }

            setLoading(false);
        };

        void loadCart();
    }, []);

    const hasPerishable = items.some((item) => ['과일', '채소'].includes(item.products?.category ?? ''));

    const itemsWithPricing = items.map((item) => {
        const product = item.products;
        const meta = item.metadata || {};
        const weightType = meta.weight_type || product.weight_type || 'fixed';

        let finalPrice = 0;
        let unitLabel = '';

        if (weightType === 'fixed') {
            finalPrice = product.price_total;
            unitLabel = `${product.weight_kg}${product.weight_unit || 'kg'}`;
        } else if (weightType === 'range') {
            const optionIndex = meta.selected_option_index ?? 0;
            const option = product.weight_options?.[optionIndex] || { weight: 1 };
            const baseWeight = product.weight_options?.[0]?.weight || 1;
            finalPrice = Math.round(product.price_total * (option.weight / baseWeight));
            unitLabel = `${option.weight}kg 옵션`;
        } else {
            const minWeight = product.min_weight ?? 0;
            const maxWeight = product.max_weight ?? 0;
            const pricePerKg = product.price_per_kg ?? 0;
            const averageWeight = (minWeight + maxWeight) / 2;
            const farmPrice = Math.round(averageWeight * pricePerKg);
            finalPrice = farmPrice + Math.round(farmPrice * 0.1) + (product.price_logistics || 3000);
            unitLabel = `${minWeight}~${maxWeight}kg (가변 중량)`;
        }

        const aiDiscount = meta.ai_discount || 0;
        finalPrice = Math.max(0, finalPrice - aiDiscount);

        return {
            ...item,
            finalPrice,
            unitLabel,
            aiDiscount,
        };
    });

    const total = itemsWithPricing.reduce((accumulator, item) => accumulator + item.finalPrice, 0);
    const baseShipping = itemsWithPricing.length > 0 ? 3000 : 0;
    const extraShipping = itemsWithPricing.length > 0 && isRemoteArea ? 3000 : 0;
    const shipping = baseShipping + extraShipping;

    const removeItem = async (itemId: string) => {
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId);

        if (!error) {
            setItems(items.filter((item) => item.id !== itemId));
        }
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>장바구니를 확인하는 중입니다...</div>;
    }

    if (!user) {
        return (
            <div className="container" style={{ paddingTop: '150px' }}>
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--accent)', borderRadius: 'var(--radius)' }}>
                    <h2>로그인이 필요합니다</h2>
                    <p style={{ margin: '16px 0 24px', color: 'var(--muted)' }}>장바구니를 이용하려면 로그인해 주세요.</p>
                    <Link className="btn-primary" href="/login">로그인하러 가기</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingTop: '120px' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>장바구니</h1>

                <div style={{ display: 'grid', gridTemplateColumns: items.length > 0 ? '1.5fr 1fr' : '1fr', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {itemsWithPricing.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                장바구니가 비어 있습니다.
                            </div>
                        ) : (
                            itemsWithPricing.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        gap: '20px',
                                        background: 'white',
                                        padding: '24px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            background: '#eee',
                                            borderRadius: '8px',
                                            backgroundImage: `url(${item.products.image_url || `https://placehold.co/200x200?text=${encodeURIComponent(item.products.name)}`})`,
                                            backgroundSize: 'cover',
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.products.name}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                                                    선택 옵션: <strong style={{ color: 'var(--primary)' }}>{item.unitLabel}</strong>
                                                </span>
                                                {item.aiDiscount !== 0 ? (
                                                    <span style={{ fontSize: '0.85rem', color: item.aiDiscount > 0 ? '#38a169' : '#d69e2e', fontWeight: 600 }}>
                                                        AI 시세 반영 ({item.aiDiscount > 0 ? '-' : '+'}{Math.abs(item.aiDiscount).toLocaleString()}원)
                                                    </span>
                                                ) : null}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{item.finalPrice.toLocaleString()}원</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => void removeItem(item.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--muted)',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '4px',
                                        }}
                                        title="삭제"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {items.length > 0 ? (
                        <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
                            <div style={{ background: 'var(--accent)', padding: '24px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>배송 옵션</h3>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    <input
                                        type="checkbox"
                                        checked={isRemoteArea}
                                        onChange={(event) => setIsRemoteArea(event.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                    />
                                    제주·도서산간 지역 배송
                                </label>
                                {isRemoteArea && hasPerishable ? (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        안내: 과일이나 채소가 포함된 경우 제주·도서산간 지역 배송이 제한될 수 있습니다.
                                    </div>
                                ) : null}
                                {isRemoteArea && !hasPerishable ? (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        제주·도서산간 지역은 추가 배송비 3,000원이 자동 반영됩니다.
                                    </div>
                                ) : null}
                            </div>

                            <div style={{ background: 'var(--accent)', padding: '32px', borderRadius: 'var(--radius)' }}>
                                <h3 style={{ marginBottom: '24px' }}>결제 상세</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)' }}>주문 금액</span>
                                        <span>{total.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)' }}>배송비</span>
                                        <span>+ {shipping.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                                        <span>총 결제 금액</span>
                                        <span style={{ color: 'var(--primary)' }}>{(total + shipping).toLocaleString()}원</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '16px', opacity: isRemoteArea && hasPerishable ? 0.5 : 1 }}
                                    onClick={async () => {
                                        if (isRemoteArea && hasPerishable) {
                                            alert('과일과 채소는 제주·도서산간 지역 배송이 제한됩니다. 장바구니를 확인해 주세요.');
                                            return;
                                        }

                                        if (!portoneStoreId || !portoneChannelKey) {
                                            alert('결제 설정이 아직 완료되지 않았습니다. 관리자에게 문의해 주세요.');
                                            return;
                                        }

                                        try {
                                            const response = await PortOne.requestPayment({
                                                storeId: portoneStoreId,
                                                channelKey: portoneChannelKey,
                                                paymentId: `payment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                                orderName: items.length === 1 ? items[0].products.name : `${items[0].products.name} 외 ${items.length - 1}건`,
                                                totalAmount: total + shipping,
                                                currency: 'KRW',
                                                payMethod: 'CARD',
                                                customer: {
                                                    customerId: user.id,
                                                    fullName: '고객명',
                                                    phoneNumber: '010-0000-0000',
                                                    email: user.email,
                                                },
                                            });

                                            if (response?.code !== undefined) {
                                                alert(`결제 실패: ${response.message}`);
                                                return;
                                            }

                                            const verifyResponse = await fetch('/api/payment/verify', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    paymentId: response?.paymentId,
                                                    amount: total + shipping,
                                                    items,
                                                    userId: user.id,
                                                    shippingAddress: isRemoteArea ? '제주·도서산간 지역 배송' : '일반 배송',
                                                }),
                                            });

                                            const verifyData = await verifyResponse.json() as { message?: string; success?: boolean };

                                            if (verifyData.success) {
                                                alert('결제와 주문 처리가 완료되었습니다.');
                                                router.push('/my-page/orders');
                                            } else {
                                                alert(`결제는 성공했지만 주문 처리 중 문제가 발생했습니다: ${verifyData.message}`);
                                            }
                                        } catch (error: unknown) {
                                            console.error('결제 호출 중 오류:', error);
                                            const message = error instanceof Error ? error.message : JSON.stringify(error);
                                            alert(`결제 창을 불러오지 못했습니다. 원인: ${message}`);
                                        }
                                    }}
                                >
                                    주문하기
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
