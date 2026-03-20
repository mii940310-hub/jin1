'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as PortOne from '@portone/browser-sdk/v2';

export default function CartPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isRemoteArea, setIsRemoteArea] = useState(false);

    useEffect(() => {
        async function loadCart() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch cart from DB
                const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();
                if (cart) {
                    const { data: cartItems } = await supabase
                        .from('cart_items')
                        .select('*, products(*)')
                        .eq('cart_id', cart.id);
                    setItems(cartItems || []);
                }
            }
            setLoading(false);
        }
        loadCart();
    }, []);

    const hasPerishable = items.some((item) => ['과일', '채소'].includes(item.products?.category));

    // 가격 계산: 상품 상세 페이지와 동일한 로직 사용
    // quantity는 선택한 수량(개수) = weight_kg와 같은 단위
    // price_total은 weight_kg 기준의 가격이므로, quantity / weight_kg 비율로 계산
    const itemsWithPricing = items.map(item => {
        const product = item.products;
        const meta = item.metadata || {};
        const weightType = meta.weight_type || product.weight_type || 'fixed';
        
        let finalPrice = 0;
        let unitLabel = '';

        if (weightType === 'fixed') {
            finalPrice = product.price_total;
            unitLabel = `${product.weight_kg}${product.weight_unit || 'kg'}`;
        } else if (weightType === 'range') {
            const optIndex = meta.selected_option_index ?? 0;
            const opt = product.weight_options?.[optIndex] || { weight: 0, price: 0 };
            finalPrice = opt.price + (product.price_fee || Math.round(opt.price * 0.1)) + (product.price_logistics || 3000);
            unitLabel = `${opt.weight}kg (세트)`;
        } else if (weightType === 'variable') {
            const avgW = (product.min_weight + product.max_weight) / 2;
            const farmPrice = Math.round(avgW * product.price_per_kg);
            finalPrice = farmPrice + Math.round(farmPrice * 0.1) + (product.price_logistics || 3000);
            unitLabel = `${product.min_weight}~${product.max_weight}kg (가변)`;
        }

        const aiDiscount = meta.ai_discount || 0;
        finalPrice = Math.max(0, finalPrice - aiDiscount);

        return {
            ...item,
            finalPrice,
            unitLabel,
            aiDiscount
        };
    });

    const total = itemsWithPricing.reduce((acc, item) => acc + item.finalPrice, 0);
    const baseShipping = itemsWithPricing.length > 0 ? 3000 : 0;
    const extraShipping = (itemsWithPricing.length > 0 && isRemoteArea) ? 3000 : 0;
    const shipping = baseShipping + extraShipping;

    // 장바구니 아이템 삭제
    const removeItem = async (itemId: string) => {
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
        if (!error) {
            setItems(items.filter(item => item.id !== itemId));
        }
    };

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>장바구니 확인 중...</div>;

    if (!user) return (
        <div style={{ paddingTop: '150px' }} className="container">
            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--accent)', borderRadius: 'var(--radius)' }}>
                <h2>로그인이 필요합니다</h2>
                <p style={{ margin: '16px 0 24px', color: 'var(--muted)' }}>장바구니를 이용하시려면 로그인해 주세요.</p>
                <Link href="/login" className="btn-primary">로그인하러 가기</Link>
            </div>
        </div>
    );

    return (
        <div className="fade-in" style={{ paddingTop: '120px' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>장바구니</h1>

                <div style={{ display: 'grid', gridTemplateColumns: items.length > 0 ? '1.5fr 1fr' : '1fr', gap: '40px' }}>
                    {/* Item List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {itemsWithPricing.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                장바구니가 비어 있습니다.
                            </div>
                        ) : (
                            itemsWithPricing.map((item) => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    gap: '20px',
                                    background: 'white',
                                    padding: '24px',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        background: '#eee',
                                        borderRadius: '8px',
                                        backgroundImage: `url(${item.products.image_url || 'https://placehold.co/200x200?text=' + item.products.name})`,
                                        backgroundSize: 'cover'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.products.name}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                                                    선택 옵션: <strong style={{ color: 'var(--primary)' }}>{item.unitLabel}</strong>
                                                </span>
                                                {item.aiDiscount !== 0 && (
                                                    <span style={{ fontSize: '0.85rem', color: item.aiDiscount > 0 ? '#38a169' : '#d69e2e', fontWeight: 600 }}>
                                                        ✨ AI 시세 연동 ({item.aiDiscount > 0 ? '-' : '+'}{Math.abs(item.aiDiscount).toLocaleString()}원)
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{item.finalPrice.toLocaleString()}원</span>
                                        </div>
                                    </div>
                                    {/* 삭제 버튼 */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--muted)',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '4px'
                                        }}
                                        title="삭제"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary */}
                    {items.length > 0 && (
                        <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
                            <div style={{ background: 'var(--accent)', padding: '24px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>배송 옵션 (도서산간)</h3>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isRemoteArea} 
                                        onChange={(e) => setIsRemoteArea(e.target.checked)} 
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                    />
                                    🏝️ 도서산간 지역 (제주도 포함)
                                </label>
                                {isRemoteArea && hasPerishable && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        ⚠️ <b>안내:</b> 장바구니에 <b>과일</b> 또는 <b>채소</b>가 포함되어 있습니다. 신선도 유지를 위해 해당 품목은 도서산간 지역 배송이 절대 불가합니다.
                                    </div>
                                )}
                                {isRemoteArea && !hasPerishable && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        ℹ️ <b>안내:</b> 곡물 등 일반 상품은 도서산간 지역 배송 시 추가 운임(+3,000원)이 발생하여 배송비에 자동 합산되었습니다.
                                    </div>
                                )}
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
                                    style={{ width: '100%', padding: '16px', opacity: (isRemoteArea && hasPerishable) ? 0.5 : 1 }}
                                    onClick={async () => {
                                        if (isRemoteArea && hasPerishable) {
                                            alert("과일 및 채소 품목은 도서산간 지역으로 배송이 불가합니다. 장바구니에서 해당 상품을 삭제하거나 배송 옵션을 변경해주세요.");
                                            return;
                                        }

                                        try {
                                            // 포트원 결제창 호출
                                            const response = await PortOne.requestPayment({
                                                // Store ID 설정 (포트원 가맹점 관리자 페이지에서 확인)
                                                storeId: "store-42deeb6f-2ce3-426c-9c76-5993de012228",

                                                // 채널 키 설정 (포트원 관리자에서 확인)
                                                channelKey: "channel-key-bdd970ae-e28e-468d-8961-c0300a1fcb8e",

                                                paymentId: `payment-${crypto.randomUUID()}`,
                                                orderName: items.length === 1 ? items[0].products.name : `${items[0].products.name} 외 ${items.length - 1}건`,
                                                totalAmount: total + shipping,
                                                currency: "KRW",
                                                payMethod: "CARD",
                                                customer: {
                                                    customerId: user.id,
                                                    fullName: "고객명", // TODO: DB 유저 이름으로 연동
                                                    phoneNumber: "010-0000-0000",
                                                    email: user.email,
                                                }
                                            });

                                            if (response?.code !== undefined) {
                                                // 오류 발생
                                                alert(`결제 실패: ${response.message}`);
                                            } else {
                                                // 결제 성공
                                                console.log("결제 성공 응답:", response);
                                                
                                                // 백엔드 검증 API 호출 및 장바구니 비우기 처리
                                                const verifyResponse = await fetch('/api/payment/verify', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        paymentId: response?.paymentId,
                                                        amount: total + shipping,
                                                        items: items,
                                                        userId: user.id,
                                                        shippingAddress: isRemoteArea ? '도서산간 지역 배송 (제주도 등)' : '일반 배송지 (테스트)' // 나중에 주소 입력란 추가 필요
                                                    })
                                                });
                                                
                                                const verifyData = await verifyResponse.json();
                                                if (verifyData.success) {
                                                    alert("결제 및 주문 처리가 완료되었습니다!");
                                                    router.push('/my-page/orders'); // 주문 내역 페이지로 이동
                                                } else {
                                                    alert("결제는 성공했으나 주문 처리 중 에러가 발생했습니다: " + verifyData.message);
                                                }
                                            }
                                        } catch (error) {
                                            console.error("결제 호출 중 에러:", error);
                                            alert("결제 창을 불러오는 데 실패했습니다.");
                                        }
                                    }}
                                >
                                    주문하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
