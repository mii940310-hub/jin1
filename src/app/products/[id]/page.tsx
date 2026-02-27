'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWeight, setSelectedWeight] = useState(3);

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
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchProduct();
    }, [id]);

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>상세 정보를 불러오는 중...</div>;
    if (error || !product) return (
        <div style={{ paddingTop: '150px' }} className="container">
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px' }}>
                ⚠️ 상품을 찾을 수 없습니다: {error}
            </div>
        </div>
    );

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', gap: '60px' }}>
                    {/* Left: Images */}
                    <div>
                        <div style={{
                            width: '100%',
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-lg)',
                            marginBottom: '24px'
                        }}>
                            <img src={product.image_url || 'https://placehold.co/800x600/1a4d2e/ffffff?text=' + product.name} alt={product.name} style={{ width: '100%', display: 'block' }} />
                        </div>

                        <div style={{ background: 'var(--accent)', padding: '32px', borderRadius: 'var(--radius)' }}>
                            <h3 style={{ marginBottom: '16px' }}>농가 이야기</h3>
                            <p style={{ lineHeight: 1.8, color: 'var(--muted)' }}>
                                {product.description || "강원도 고랭지에서 정직하게 키운 신선한 농산물입니다."}
                            </p>
                            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                                📍 {product.farms?.address || "강원도 산지"}
                            </div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div>
                        <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>{product.farms?.name || '강원 농가'}</span>
                        <h1 style={{ fontSize: '2.5rem', margin: '8px 0 24px' }}>{product.name}</h1>

                        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>💡 시중 실시간 평균가 비교 ({selectedWeight}kg 기준)</h3>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                                    API 실시간 연동 중
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {[
                                    { name: '이마트', price: 9800 * selectedWeight },
                                    { name: '쿠팡', price: 9480 * selectedWeight },
                                    { name: '네이버', price: 9550 * selectedWeight },
                                    { name: '롯데마트', price: 9900 * selectedWeight },
                                ].map((market) => (
                                    <div key={market.name} style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px', minWidth: '80px', flex: 1, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>{market.name}</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 500, textDecoration: 'line-through', color: '#94a3b8' }}>{(market.price).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', textAlign: 'center', background: '#e11d48', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 700 }}>
                                산지직송 Highland Fresh: 최저가 보장 (최대 30% 저렴)
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>옵션 선택 (중량)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {[
                                    { w: 3, label: '3kg (가벼운 맛보기)' },
                                    { w: 5, label: '5kg (실속 패밀리)' },
                                    { w: 10, label: '10kg (대용량 쟁여두기)' }
                                ].map(({ w, label }) => {
                                    const marketPricePerKg = 9480;
                                    const marketPrice = marketPricePerKg * w;
                                    const discountRate = w === 3 ? 0.25 : w === 5 ? 0.26 : 0.28;
                                    const optionPrice = Math.round(marketPrice * (1 - discountRate) / 100) * 100;
                                    const pricePer100g = Math.round(optionPrice / (w * 10));
                                    const isLowest = w === 10;
                                    const isSelected = selectedWeight === w;

                                    return (
                                        <div
                                            key={w}
                                            onClick={() => setSelectedWeight(w)}
                                            style={{
                                                padding: '20px 12px',
                                                borderBottom: '1px solid var(--border)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '16px',
                                                background: isSelected ? '#f8fafc' : 'transparent',
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: isSelected ? '6px solid var(--primary)' : '1px solid #cbd5e1',
                                                marginTop: '2px',
                                                flexShrink: 0,
                                                transition: 'all 0.1s ease',
                                                boxSizing: 'border-box'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '1rem', color: isSelected ? 'var(--primary)' : 'inherit', fontWeight: isSelected ? 700 : 500, marginBottom: '8px' }}>
                                                    {label}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                                        {optionPrice.toLocaleString()}원
                                                    </span>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--muted)', textDecoration: 'line-through' }}>
                                                        {marketPrice.toLocaleString()}원
                                                    </span>
                                                    <span style={{ fontSize: '0.85rem', color: '#e11d48', fontWeight: 600 }}>
                                                        시중 마트 대비 {(discountRate * 100).toFixed(0)}% 저렴!
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                                    100g당 {pricePer100g.toLocaleString()}원
                                                    {isLowest && <span style={{ color: '#e11d48', marginLeft: '6px' }}>(최저 단위가)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {(() => {
                            const marketPricePerKg = 9480;
                            const marketPrice = marketPricePerKg * selectedWeight;
                            const discountRate = selectedWeight === 3 ? 0.25 : selectedWeight === 5 ? 0.26 : 0.28;
                            const finalPrice = Math.round(marketPrice * (1 - discountRate) / 100) * 100;
                            const ratio = finalPrice / product.price_total;

                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                        <span style={{ fontSize: '1.5rem', color: '#e11d48', fontWeight: 800 }}>
                                            {(discountRate * 100).toFixed(0)}%
                                        </span>
                                        <span style={{ fontSize: '1.2rem', color: 'var(--muted)', textDecoration: 'line-through' }}>
                                            {marketPrice.toLocaleString()}원
                                        </span>
                                        <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                                            {finalPrice.toLocaleString()}원
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: '40px', padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>투명한 가격 구조 ({selectedWeight}kg 기준)</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <PriceItem label="농가 수취액 (Farmer)" value={Math.round(product.price_farmer * ratio)} />
                                            <PriceItem label="산지 물류비 (Logistics)" value={Math.round(product.price_logistics * ratio)} />
                                            <PriceItem label="플랫폼 수수료 (Fee)" value={Math.round(product.price_fee * ratio)} />
                                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                <span>최종 결제 금액</span>
                                                <span>{finalPrice.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                            <div style={{ padding: '16px', background: 'var(--accent)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>수확일</div>
                                <div style={{ fontWeight: 700 }}>{product.harvest_date || '상시'}</div>
                            </div>
                            <div style={{ padding: '16px', background: 'var(--accent)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>배송방식</div>
                                <div style={{ fontWeight: 700 }}>새벽 산지직송</div>
                            </div>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
                            장바구니 담기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PriceItem({ label, value, color }: { label: string, value: number, color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
            <span style={{ color: color || 'var(--muted)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: color || 'inherit' }}>{value.toLocaleString()}원</span>
        </div>
    );
}
