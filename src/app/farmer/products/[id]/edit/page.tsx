'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function EditProduct() {
    const router = useRouter();
    const params = useParams();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'vegetable' | 'grain'>('vegetable');
    const [harvestDate, setHarvestDate] = useState('');
    const [description, setDescription] = useState('');
    const [basePrice, setBasePrice] = useState(8000);
    const [weightKg, setWeightKg] = useState(10);
    const [stockQuantity, setStockQuantity] = useState(100);
    const [calculating, setCalculating] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [farmId, setFarmId] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const logistics = 3000;
    const platformFee = Math.round(basePrice * 0.1);
    const totalPrice = basePrice + logistics + platformFee;
    const pricePerKg = Math.round(totalPrice / weightKg);

    useEffect(() => {
        const fetchProductData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();
            if (farm) setFarmId(farm.id);

            // Fetch product data
            if (params.id) {
                const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single();
                if (product) {
                    setName(product.name);
                    setCategory(product.category as any);
                    setHarvestDate(product.harvest_date);
                    setDescription(product.description || '');
                    setBasePrice(product.price_farmer);
                    setWeightKg(product.weight_kg);
                    setStockQuantity(product.stock_quantity);
                    setImageUrl(product.image_url);
                }
            }
        };
        fetchProductData();
    }, [router, params.id]);

    const handlePriceRecommendation = async () => {
        if (!harvestDate) {
            alert('수확 예정일을 먼저 선택해주세요.');
            return;
        }
        setCalculating(true);
        setAiReasoning(null);

        try {
            const response = await fetch('/api/ai/price-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, currentPrice: basePrice, harvestDate, productName: name })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setAiReasoning(data.reasoning);
            if (data.recommendedPrice) setBasePrice(data.recommendedPrice);
        } catch (error: any) {
            console.error('AI_PRICE_ERROR:', error);
            alert('AI 분석 중 오류가 발생했습니다.');
        } finally {
            setCalculating(false);
        }
    };

    const handleUpdate = async () => {
        if (!name || !harvestDate) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setLoading(true);

        const payload = {
            name,
            category,
            harvest_date: harvestDate,
            description,
            price_farmer: basePrice,
            price_logistics: logistics,
            price_fee: platformFee,
            price_total: totalPrice,
            weight_kg: weightKg,
            stock_quantity: stockQuantity,
        };

        const { error } = await supabase.from("products").update(payload).eq('id', params.id);

        if (error) {
            console.error("PRODUCT_UPDATE_ERROR:", error);
            alert(`수정 실패: ${error.message}`);
            setLoading(false);
            return;
        }

        alert("상품 수정 완료!");
        router.push('/farmer/products');
    };

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '32px' }}>상품 정보 수정</h1>

                <div style={{ display: 'grid', gap: '32px' }}>
                    {/* Form Section */}
                    <section style={{ background: 'white', padding: '32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>품목 선택</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            >
                                <option value="vegetable">채소 (배추, 무 등)</option>
                                <option value="grain">곡물 (옥수수, 감자 등)</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>상품명</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        {imageUrl && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>현재 이미지</label>
                                <img src={imageUrl} alt="Product" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>상세 설명</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '200px', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>재고 수량 (박스)</label>
                            <input
                                type="number"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(Number(e.target.value))}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>수확 예정일</label>
                            <input
                                type="date"
                                value={harvestDate}
                                onChange={(e) => setHarvestDate(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>박스당 중량 (kg)</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                    <span>kg</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>희망 수취가 (박스당)</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                    <span>원</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <button onClick={handlePriceRecommendation} disabled={calculating} style={{ width: '100%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                {calculating ? '전문 AI가 시세를 분석하고 있습니다...' : '✨ AI 적정 가격 다시 추천받기'}
                            </button>
                            {aiReasoning && (
                                <div style={{ marginTop: '16px', padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', fontSize: '0.95rem', color: '#065f46', whiteSpace: 'pre-wrap' }}>
                                    {aiReasoning}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Pricing Breakdown Card */}
                    <section className="glass" style={{ padding: '32px', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'white' }}>
                        <h3 style={{ marginBottom: '20px' }}>📊 실시간 판매가 자동 산출</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>농가 수취액 (내 통장 입금액)</span>
                                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#6ee7b7' }}>{basePrice.toLocaleString()}원</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>플랫폼 수수료 (10%)</span>
                                <span>+ {platformFee.toLocaleString()}원</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>산지 직배송 물류비</span>
                                <span>+ {logistics.toLocaleString()}원</span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '1.75rem', fontWeight: 800 }}>
                                <div>최종 고객 판매가</div>
                                <div>{totalPrice.toLocaleString()}원</div>
                            </div>
                        </div>
                    </section>

                    <button className="btn-primary" onClick={handleUpdate} disabled={loading} style={{ padding: '20px', fontSize: '1.25rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? '수정 중...' : '상품 수정 완료하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
