// Next.js HMR Trigger
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, farms(*)')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                setProduct(data);
                
                // Set initial selection based on type
                if (data.weight_type === 'range' && data.weight_options?.length > 0) {
                    setSelectedQuantity(data.weight_options[0].weight);
                } else if (data.weight_type === 'variable') {
                    setSelectedQuantity((data.min_weight + data.max_weight) / 2);
                } else {
                    setSelectedQuantity(data.weight_kg || 1);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchProduct();
    }, [id]);    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>상세 정보를 불러오는 중...</div>;
    if (error || !product) return (
        <div style={{ paddingTop: '150px' }} className="container">
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px' }}>
                ⚠️ 상품을 찾을 수 없습니다: {error}
            </div>
        </div>
    );

    // Calc logic for UI
    const weightType = product.weight_type || 'fixed';
    
    // Determine base weight to calculate proportional scale factor
    let baseWeight = 1;
    let baseTotalPrice = 0;
    
    if (weightType === 'fixed') {
        baseWeight = product.weight_kg || 1;
        baseTotalPrice = product.price_total;
    } else if (weightType === 'range') {
        baseWeight = product.weight_options?.[0]?.weight || 1;
        // DB의 단일 진실원천인 `price_total`을 기준으로 100% 동기화 (오류 방지)
        baseTotalPrice = product.price_total;
    } else if (weightType === 'variable') {
        baseWeight = (product.min_weight + product.max_weight) / 2 || 1;
        const avgW = (product.min_weight + product.max_weight) / 2;
        baseTotalPrice = Math.round(avgW * product.price_per_kg);
    }
    const scaleFactor = selectedQuantity / Math.max(0.1, baseWeight);

    let currentTotalPrice = Math.round(baseTotalPrice * scaleFactor);
    let internalRecommendedPrice = Math.round(currentTotalPrice * 1.05); // 내부 추천 적정가 (내부 마진 및 신선도 가중치 반영)

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', gap: '60px' }}>
                    {/* Left */}
                    <div>
                        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', marginBottom: '24px' }}>
                            <img src={product.image_url || 'https://placehold.co/800x600/1a4d2e/ffffff?text=' + product.name} alt={product.name} style={{ width: '100%', display: 'block' }} />
                        </div>
                        <div style={{ background: '#f8faf8', padding: '32px', borderRadius: '16px', border: '1px solid #eefef1' }}>
                            <h3 style={{ marginBottom: '16px', color: 'var(--primary)', fontWeight: 800 }}>🧑‍🌾 생산자 한마디</h3>
                            <p style={{ lineHeight: 1.8, color: '#444', fontSize: '1.05rem' }}>
                                {product.description || "슝팜이 보증하는 정직한 농산물입니다."}
                            </p>
                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eefef1', fontSize: '0.9rem', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📍 원산지: {product.farms?.address || "강원도 산지"}
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 24px' }}>{product.name}</h1>

                        {/* 1. 가격 표기 및 안내 (소비자 친화적 심플 UI) */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'inline-block', marginBottom: '16px', background: '#ebf8ff', padding: '8px 16px', borderRadius: '20px', color: '#2b6cb0', fontSize: '0.9rem', fontWeight: 600 }}>
                                ✓ 산지직송 슝팜 특별가 적용
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#e53e3e', letterSpacing: '-1px' }}>
                                    {currentTotalPrice.toLocaleString()}<span style={{ fontSize: '1.5rem', fontWeight: 700 }}>원</span>
                                </span>
                                <span style={{ fontSize: '1.1rem', color: '#718096', textDecoration: 'line-through' }}>
                                    {Math.round(currentTotalPrice * 1.3).toLocaleString()}원
                                </span>
                            </div>
                        </div>
                        <div style={{ 
                            background: '#fffaeb', 
                            borderLeft: '4px solid #f6e05e', 
                            padding: '16px 20px', 
                            borderRadius: '0 8px 8px 0', 
                            marginBottom: '32px',
                            color: '#744210',
                            fontSize: '1rem',
                            fontWeight: 700,
                            lineHeight: 1.5
                        }}>
                            "본 상품은 슝팜 산지직송 투명 가격 구조를 통해<br/>
                            가장 합리적이고 신선하게 제공됩니다."
                        </div>

                        {/* 중량 선택 (데이터 영역 연장) */}
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: '16px' }}>중량 선택</h3>
                            
                            {weightType === 'fixed' && (
                                <div style={{ border: '2px solid var(--primary)', padding: '16px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>{product.weight_kg}{product.weight_unit} (기본 중량)</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentTotalPrice.toLocaleString()}원</span>
                                </div>
                            )}

                            {weightType === 'range' && (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {product.weight_options?.map((opt: any, idx: number) => (
                                        <div key={idx} onClick={() => { setSelectedOptionIndex(idx); setSelectedQuantity(opt.weight); }} style={{
                                            padding: '16px', borderRadius: '12px', border: selectedOptionIndex === idx ? '2px solid var(--primary)' : '1px solid #eee',
                                            background: selectedOptionIndex === idx ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: 'all 0.2s'
                                        }}>
                                            <span style={{ fontWeight: 600 }}>{opt.weight}kg</span>
                                            <div>
                                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{Math.round(currentTotalPrice * (opt.weight / selectedQuantity)).toLocaleString()}원</span>
                                                <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '8px' }}>재고 {opt.stock}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {weightType === 'variable' && (
                                <div style={{ border: '1px solid var(--primary)', padding: '24px', borderRadius: '16px', background: '#f0fdf4' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>실중량 기준: {product.min_weight} ~ {product.max_weight}kg</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>kg당 {Math.round(currentTotalPrice / selectedQuantity).toLocaleString()}원</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46', lineHeight: 1.5 }}>
                                        📢 본 상품은 <strong>실물 무게에 따라 가격이 결정</strong>되는 상품입니다.<br />
                                        수확 및 포장 시점에 가장 신선한 상태로 실측하여 최종 금액이 확정됩니다.
                                    </p>
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dotted #10b981', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#444' }}>예상가 (평균무게 기준)</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.4rem' }}>{currentTotalPrice.toLocaleString()}원</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. 상품 정보 영역 (감성, 신뢰 기반) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #c6f6d5' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🚜</div>
                                <div style={{ fontWeight: 800, color: '#22543d', fontSize: '0.95rem' }}>산지 직송</div>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #c6f6d5' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>☀️</div>
                                <div style={{ fontWeight: 800, color: '#22543d', fontSize: '0.95rem' }}>당일 수확 후 발송</div>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #c6f6d5' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤝</div>
                                <div style={{ fontWeight: 800, color: '#22543d', fontSize: '0.95rem' }}>중간 유통 없음</div>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #c6f6d5' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🥬</div>
                                <div style={{ fontWeight: 800, color: '#22543d', fontSize: '0.95rem' }}>신선 배송</div>
                            </div>
                        </div>

                        {/* 3. Summary & Cart Button (결제) */}
                        <div style={{ background: '#333', color: 'white', padding: '32px', borderRadius: '16px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', opacity: 0.8, fontSize: '0.9rem' }}>
                                <span>상품 금액 (배송비 제외)</span>
                                <span>{currentTotalPrice.toLocaleString()}원</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', opacity: 0.8, fontSize: '0.9rem' }}>
                                <span>배송비</span>
                                <span>+ 3,000원</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>최종 결제 예정 금액</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{currentTotalPrice.toLocaleString()}원</div>
                                </div>
                            </div>
                        </div>

                        {weightType === 'variable' && (
                            <div style={{ marginBottom: '24px', padding: '12px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2', fontSize: '0.85rem', color: '#c53030' }}>
                                ⚠️ <strong>최종 결제 안내:</strong> 출고 시 실제 무게 기준으로 최종 금액이 고지 및 조정됩니다.
                            </div>
                        )}

                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '24px', fontSize: '1.25rem', fontWeight: 800, borderRadius: '16px', boxShadow: '0 8px 24px rgba(26,77,46,0.2)' }}
                            disabled={addingToCart}
                            onClick={async () => {
                                setAddingToCart(true);
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (!user) {
                                        alert('로그인이 필요합니다.');
                                        router.push(`/login?redirect=/products/${product.id}`);
                                        return;
                                    }
                                    let { data: cart } = await supabase.from('carts').select('*').eq('user_id', user.id).maybeSingle();
                                    if (!cart) {
                                        const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select().single();
                                        cart = newCart;
                                    }
                                    
                                    const cartItemPayload: any = {
                                        cart_id: cart?.id,
                                        product_id: product.id,
                                        quantity: 1,
                                        metadata: {
                                            weight_type: weightType,
                                            selected_quantity: selectedQuantity,
                                            selected_option_index: weightType === 'range' ? selectedOptionIndex : null,
                                            weight_unit: product.weight_unit || 'kg',
                                            internal_recommended_price: internalRecommendedPrice
                                        }
                                    };

                                    const { error: insertError } = await supabase.from('cart_items').insert(cartItemPayload);
                                    if (confirm('장바구니에 담겼습니다. 장바구니로 이동할까요?')) {
                                        router.push('/cart');
                                    }
                                } catch (e: any) {
                                    alert('장바구니 담기에 실패했습니다.');
                                } finally {
                                    setAddingToCart(false);
                                }
                            }}
                        >
                            {addingToCart ? '장바구니 담는 중...' : '슝- 장바구니에 담기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
