'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterProduct() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'vegetable' | 'grain'>('vegetable');
    const [harvestDate, setHarvestDate] = useState('');
    const [description, setDescription] = useState('');
    const [basePrice, setBasePrice] = useState(8000); // Farm 수취액
    const [weightKg, setWeightKg] = useState(10); // 박스당 무게 (기본 10kg)
    const [calculating, setCalculating] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [farmId, setFarmId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const logistics = 3000;
    const platformFee = Math.round(basePrice * 0.1);
    const totalPrice = basePrice + logistics + platformFee;
    const pricePerKg = Math.round(totalPrice / weightKg);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            // Get farmer's farm_id
            const { data: farm } = await supabase
                .from('farms')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (farm) {
                setFarmId(farm.id);
            }
        };
        checkUser();
    }, [router]);

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
                body: JSON.stringify({
                    category,
                    currentPrice: basePrice,
                    harvestDate,
                    productName: name
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setAiReasoning(data.reasoning);
            if (data.recommendedPrice) {
                setBasePrice(data.recommendedPrice);
            }
        } catch (error: any) {
            console.error('AI_PRICE_ERROR:', error);
            alert('AI 분석 중 오류가 발생했습니다.');
        } finally {
            setCalculating(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !harvestDate) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setLoading(true);

        let imageUrl = null;
        if (imageFile) {
            const ext = imageFile.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
            const filePath = `${farmId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Upload error:", uploadError);
                alert("이미지 업로드에 실패했습니다.");
                setLoading(false);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        }

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
            farm_id: farmId,
            stock_quantity: 100, // Default value
            image_url: imageUrl
        };

        const { data, error } = await supabase
            .from("products")
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("PRODUCT_INSERT_ERROR:", error);
            alert(`등록 실패: ${error.message}`);
            setLoading(false);
            return;
        }

        alert("상품 등록 완료!");
        router.push('/farmer');
    };

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '32px' }}>상품 등록하기</h1>

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
                                placeholder="예: 대관령 갓 수확한 고랭지 배추 10kg"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>상품 사진 등록</label>
                            <label style={{
                                width: '100%',
                                minHeight: '150px',
                                border: '2px dashed var(--border)',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: '#f8fafc',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                                        <span>사진을 찍거나 갤러리에서 선택해주세요</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setImageFile(file);
                                            setImagePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontWeight: 600 }}>상세 설명 (블로그형)</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>자유롭게 상품의 장점을 자랑해보세요</span>
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="블로그에 글을 쓰듯 상품이 자라난 환경, 특별한 맛, 농가의 정성 등을 자유롭게 설명해주세요!"
                                style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '250px', fontFamily: 'inherit', fontSize: '1rem', lineHeight: '1.6', resize: 'vertical' }}
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
                                    <input
                                        type="number"
                                        value={weightKg}
                                        onChange={(e) => setWeightKg(Number(e.target.value))}
                                        placeholder="예: 10"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <span>kg</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>희망 수취가 (박스당)</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(Number(e.target.value))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <span>원</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <button
                                onClick={handlePriceRecommendation}
                                disabled={calculating}
                                style={{ width: '100%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                            >
                                {calculating ? '전문 AI가 시세를 분석하고 있습니다...' : '✨ AI 적정 가격 추천받기'}
                            </button>

                            {aiReasoning && (
                                <div style={{ marginTop: '16px', padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', fontSize: '0.95rem', lineHeight: 1.6, color: '#065f46', position: 'relative' }}>
                                    <div style={{ fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        🤖 AI 시장 분석 결과
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{aiReasoning}</div>
                                </div>
                            )}

                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
                                * Gemini AI가 가락시장 공공 데이터와 수확기 수급 예측 데이터를 기반으로 분석합니다.
                            </p>
                        </div>
                    </section>

                    {/* Pricing Breakdown Card */}
                    <section className="glass" style={{ padding: '32px', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        {/* Garak Market Comparison Badge */}
                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.9 }}>🔥 가락시장 도매가 대비 수익 비교</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', opacity: 0.8, textDecoration: 'line-through', marginRight: '8px' }}>
                                        가락시장 출하 시: {Math.round(basePrice * 0.65 / 100) * 100}원 예상
                                    </span>
                                </div>
                                <div style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                    약 {Math.round(basePrice * 0.35 / 100) * 100}원 더 벌어요!
                                </div>
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📊 실시간 판매가 자동 산출 ({weightKg}kg 기준)
                        </h3>
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
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '4px' }}>최종 고객 판매가</div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalPrice.toLocaleString()}원</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
                                        1kg당 <strong>{pricePerKg.toLocaleString()}원</strong> 꼴
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <button
                        className="btn-primary"
                        onClick={handleRegister}
                        disabled={loading}
                        style={{ padding: '20px', fontSize: '1.25rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? '등록 중...' : '상품 등록 완료하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
