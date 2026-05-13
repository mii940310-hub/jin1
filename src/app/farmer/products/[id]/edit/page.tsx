'use client';

import Image from 'next/image';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Category = 'grain' | 'vegetable';
type WeightType = 'fixed' | 'range' | 'variable';
type WeightUnit = 'g' | 'kg';

type WeightOption = {
    price: number;
    stock: number;
    weight: number;
};

type ProductEditRecord = {
    category: Category | null;
    description: string | null;
    farm_id: string | null;
    harvest_date: string | null;
    id: string;
    image_url: string | null;
    max_weight?: number | null;
    min_weight?: number | null;
    name: string;
    price_per_kg?: number | null;
    price_total: number;
    weight_kg?: number | null;
    weight_options?: WeightOption[] | null;
    weight_type?: WeightType | null;
    weight_unit?: WeightUnit | null;
};

type AiDescriptionResult = {
    ai_generated_description?: string | null;
    ai_generated_features?: string[] | null;
    ai_generated_shipping_guide?: string | null;
    ai_generated_storage_guide?: string | null;
    ai_generated_summary?: string | null;
    ai_generated_title?: string | null;
    ai_generated_faq?: unknown;
    ai_warning_notes?: string | null;
};

type AiSpecsResult = {
    ai_confusion_warning?: string | null;
    ai_household_guide?: string | null;
    ai_packaging_note?: string | null;
    ai_quantity_guide?: string | null;
    ai_standardized_spec?: string | null;
};

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const productId = params?.id;

    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>('vegetable');
    const [harvestDate, setHarvestDate] = useState('');
    const [description, setDescription] = useState('');
    const [weightType, setWeightType] = useState<WeightType>('fixed');
    const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
    const [fixedWeight, setFixedWeight] = useState(1);
    const [basePrice, setBasePrice] = useState<number | ''>('');
    const [weightOptions, setWeightOptions] = useState<WeightOption[]>([{ weight: 3, price: 15000, stock: 100 }]);
    const [minWeight, setMinWeight] = useState(8);
    const [maxWeight, setMaxWeight] = useState(10);
    const [pricePerKg, setPricePerKg] = useState(1500);
    const [loading, setLoading] = useState(false);
    const [farmId, setFarmId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aiDescriptionData, setAiDescriptionData] = useState<AiDescriptionResult | null>(null);
    const [aiSpecsData, setAiSpecsData] = useState<AiSpecsResult | null>(null);
    const [aiLoading, setAiLoading] = useState({ desc: false, specs: false });

    useEffect(() => {
        const loadProduct = async () => {
            if (!productId) {
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();
            if (!farm) {
                router.push('/farmer/register');
                return;
            }
            setFarmId(farm.id);

            const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
            const record = product as ProductEditRecord | null;

            if (!record || record.farm_id !== farm.id) {
                alert('상품을 찾을 수 없거나 수정 권한이 없습니다.');
                router.push('/farmer/products');
                return;
            }

            setName(record.name);
            setCategory(record.category || 'vegetable');
            setHarvestDate(record.harvest_date || '');
            setDescription(record.description || '');
            setWeightType(record.weight_type || 'fixed');
            setWeightUnit(record.weight_unit || 'kg');
            setImagePreview(record.image_url);

            if (record.weight_type === 'range') {
                setWeightOptions(record.weight_options || []);
            } else if (record.weight_type === 'variable') {
                setMinWeight(record.min_weight || 8);
                setMaxWeight(record.max_weight || 10);
                setPricePerKg(record.price_per_kg || 1500);
            } else {
                const weightKg = record.weight_kg || 1;
                setFixedWeight((record.weight_unit || 'kg') === 'kg' ? weightKg : weightKg * 1000);
                setBasePrice(record.price_total);
            }
        };

        void loadProduct();
    }, [productId, router]);

    const updateOption = (index: number, field: keyof WeightOption, value: number) => {
        setWeightOptions((previous) => previous.map((option, optionIndex) => (
            optionIndex === index ? { ...option, [field]: value } : option
        )));
    };

    const addOption = () => {
        setWeightOptions((previous) => [...previous, { weight: 0, price: 0, stock: 100 }]);
    };

    const removeOption = (index: number) => {
        setWeightOptions((previous) => previous.filter((_, optionIndex) => optionIndex !== index));
    };

    const applyTemplate = (template: 'cabbage' | 'potato') => {
        if (template === 'potato') {
            setName('강원도 햇감자 박스');
            setWeightType('range');
            setWeightOptions([
                { weight: 3, price: 12000, stock: 100 },
                { weight: 5, price: 18000, stock: 100 },
                { weight: 10, price: 32000, stock: 50 },
            ]);
            return;
        }

        setName('산지직송 배추 박스');
        setWeightType('variable');
        setMinWeight(8);
        setMaxWeight(10);
        setPricePerKg(1800);
    };

    const handleGenerateDescription = async () => {
        setAiLoading((previous) => ({ ...previous, desc: true }));
        try {
            const response = await fetch('/api/ai/product-description', {
                method: 'POST',
                body: JSON.stringify({ name, category, harvestDate, description }),
            });
            const data = await response.json() as AiDescriptionResult & { error?: string };
            if (!response.ok) {
                throw new Error(data.error || 'AI 설명 생성에 실패했습니다.');
            }
            setAiDescriptionData(data);
            alert('AI 상세 설명 초안이 생성되었습니다.');
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'AI 설명 생성에 실패했습니다.';
            alert(message);
        } finally {
            setAiLoading((previous) => ({ ...previous, desc: false }));
        }
    };

    const handleStandardizeSpecs = async () => {
        setAiLoading((previous) => ({ ...previous, specs: true }));
        try {
            const response = await fetch('/api/ai/standardize-specs', {
                method: 'POST',
                body: JSON.stringify({ name, weightType, minWeight, maxWeight, fixedWeight, weightUnit, description }),
            });
            const data = await response.json() as AiSpecsResult & { error?: string };
            if (!response.ok) {
                throw new Error(data.error || '규격 정리에 실패했습니다.');
            }
            setAiSpecsData(data);
            alert('규격 정리 안내가 생성되었습니다.');
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : '규격 정리에 실패했습니다.';
            alert(message);
        } finally {
            setAiLoading((previous) => ({ ...previous, specs: false }));
        }
    };

    const handleSubmit = async () => {
        if (!productId || !farmId || !name || !harvestDate) {
            alert('필수 정보를 먼저 확인해 주세요.');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = imagePreview;
            if (imageFile) {
                const ext = imageFile.name.split('.').pop() || 'jpg';
                const filePath = `${farmId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('products').upload(filePath, imageFile);
                if (!uploadError) {
                    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                }
            }

            const packagingFee = 1500;
            const payload: Record<string, unknown> = {
                name,
                category,
                harvest_date: harvestDate,
                description,
                farm_id: farmId,
                image_url: imageUrl,
                weight_type: weightType,
                weight_unit: weightUnit,
                price_logistics: packagingFee,
                ai_generated_title: aiDescriptionData?.ai_generated_title || null,
                ai_generated_summary: aiDescriptionData?.ai_generated_summary || null,
                ai_generated_features: aiDescriptionData?.ai_generated_features || null,
                ai_generated_description: aiDescriptionData?.ai_generated_description || null,
                ai_generated_storage_guide: aiDescriptionData?.ai_generated_storage_guide || null,
                ai_generated_shipping_guide: aiDescriptionData?.ai_generated_shipping_guide || null,
                ai_generated_faq: aiDescriptionData?.ai_generated_faq || null,
                ai_warning_notes: aiDescriptionData?.ai_warning_notes || null,
                ai_standardized_spec: aiSpecsData?.ai_standardized_spec || null,
                ai_quantity_guide: aiSpecsData?.ai_quantity_guide || null,
                ai_household_guide: aiSpecsData?.ai_household_guide || null,
                ai_packaging_note: aiSpecsData?.ai_packaging_note || null,
                ai_confusion_warning: aiSpecsData?.ai_confusion_warning || null,
                ai_applied: Boolean(aiDescriptionData || aiSpecsData),
            };

            if (weightType === 'fixed') {
                const finalTotal = Number(basePrice) || 0;
                payload.weight_kg = weightUnit === 'kg' ? fixedWeight : fixedWeight / 1000;
                payload.price_total = finalTotal;
                payload.price_fee = Math.round(finalTotal * 0.1);
                payload.price_farmer = finalTotal - Math.round(finalTotal * 0.1) - packagingFee;
                payload.stock_quantity = 100;
            } else if (weightType === 'range') {
                const modifiedOptions = weightOptions.map((option) => {
                    const fee = Math.round(option.price * 0.1);
                    return { ...option, price_farmer: option.price - fee - packagingFee };
                });
                const firstOption = modifiedOptions[0];
                payload.weight_options = modifiedOptions;
                payload.weight_kg = firstOption?.weight || 0;
                payload.price_total = firstOption?.price || 0;
                payload.price_fee = Math.round((firstOption?.price || 0) * 0.1);
                payload.price_farmer = (firstOption?.price || 0) - Math.round((firstOption?.price || 0) * 0.1) - packagingFee;
                payload.stock_quantity = modifiedOptions.reduce((sum, option) => sum + option.stock, 0);
            } else {
                const averageWeight = (minWeight + maxWeight) / 2;
                const finalTotal = Math.round(averageWeight * pricePerKg);
                payload.min_weight = minWeight;
                payload.max_weight = maxWeight;
                payload.price_per_kg = pricePerKg;
                payload.weight_kg = averageWeight;
                payload.price_total = finalTotal;
                payload.price_fee = Math.round(finalTotal * 0.1);
                payload.price_farmer = finalTotal - Math.round(finalTotal * 0.1) - packagingFee;
                payload.stock_quantity = 100;
            }

            const { error } = await supabase.from('products').update(payload as never).eq('id', productId);
            if (error) {
                throw error;
            }

            alert('상품 수정이 완료되었습니다.');
            router.push('/farmer/products');
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : '상품 수정에 실패했습니다.';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px', background: '#f9fbf9' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>상품 수정</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => applyTemplate('potato')} style={chipButtonStyle}>감자 예시 적용</button>
                        <button onClick={() => applyTemplate('cabbage')} style={chipButtonStyle}>배추 예시 적용</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '24px' }}>
                    <Card title="기본 정보">
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>상품명</label>
                            <input type="text" value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>카테고리</label>
                                <select value={category} onChange={(event) => setCategory(event.target.value as Category)} style={inputStyle}>
                                    <option value="vegetable">채소</option>
                                    <option value="grain">곡물</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>수확일</label>
                                <input type="date" value={harvestDate} onChange={(event) => setHarvestDate(event.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    </Card>

                    <Card title="무게와 가격 설정">
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <Tab active={weightType === 'fixed'} icon="1" label="고정 중량" sub="예: 1kg" onClick={() => setWeightType('fixed')} />
                            <Tab active={weightType === 'range'} icon="2" label="옵션형" sub="예: 3kg, 5kg" onClick={() => setWeightType('range')} />
                            <Tab active={weightType === 'variable'} icon="3" label="가변형" sub="예: 8~10kg" onClick={() => setWeightType('variable')} />
                        </div>

                        {weightType === 'fixed' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px', alignItems: 'flex-end' }}>
                                <div>
                                    <label style={labelStyle}>중량</label>
                                    <input type="number" value={fixedWeight} onChange={(event) => setFixedWeight(Number(event.target.value))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>단위</label>
                                    <select value={weightUnit} onChange={(event) => setWeightUnit(event.target.value as WeightUnit)} style={inputStyle}>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>판매가</label>
                                    <input type="number" value={basePrice} onChange={(event) => setBasePrice(Number(event.target.value))} style={inputStyle} />
                                </div>
                            </div>
                        )}

                        {weightType === 'range' && (
                            <div>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>여러 옵션을 구성할 수 있습니다.</span>
                                    <button onClick={addOption} style={{ color: 'var(--primary)', fontWeight: 700 }}>+ 옵션 추가</button>
                                </div>
                                {weightOptions.map((option, index) => (
                                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 40px', gap: '12px', marginBottom: '12px', alignItems: 'center', background: '#f8faf8', padding: '12px', borderRadius: '8px' }}>
                                        <input type="number" value={option.weight} onChange={(event) => updateOption(index, 'weight', Number(event.target.value))} placeholder="중량" style={inputStyle} />
                                        <input type="number" value={option.price} onChange={(event) => updateOption(index, 'price', Number(event.target.value))} placeholder="가격" style={inputStyle} />
                                        <input type="number" value={option.stock} onChange={(event) => updateOption(index, 'stock', Number(event.target.value))} placeholder="재고" style={inputStyle} />
                                        <button onClick={() => removeOption(index)} style={{ color: '#ff4d4f', fontSize: '1.2rem' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {weightType === 'variable' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={labelStyle}>최소 중량</label>
                                    <input type="number" value={minWeight} onChange={(event) => setMinWeight(Number(event.target.value))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>최대 중량</label>
                                    <input type="number" value={maxWeight} onChange={(event) => setMaxWeight(Number(event.target.value))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>kg당 가격</label>
                                    <input type="number" value={pricePerKg} onChange={(event) => setPricePerKg(Number(event.target.value))} style={inputStyle} />
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                            <button onClick={handleStandardizeSpecs} disabled={aiLoading.specs} style={{ ...aiButtonStyle, width: '100%' }}>
                                {aiLoading.specs ? '규격 정리 중...' : 'AI 규격 정리'}
                            </button>
                        </div>
                        {aiSpecsData && (
                            <div style={aiResultBoxStyle}>
                                <strong>표준 규격:</strong> {aiSpecsData.ai_standardized_spec}
                                <br />
                                <strong>수량 가이드:</strong> {aiSpecsData.ai_quantity_guide}
                                <br />
                                <strong>주의 문구:</strong> {aiSpecsData.ai_confusion_warning}
                            </div>
                        )}
                    </Card>

                    <Card title="사진과 상세 설명">
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>대표 사진</label>
                            <label style={imageUploadStyle}>
                                {imagePreview ? (
                                    <Image alt="미리보기" fill sizes="100vw" src={imagePreview} style={{ objectFit: 'cover' }} unoptimized />
                                ) : (
                                    <span style={{ color: '#888' }}>사진 선택</span>
                                )}
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (!file) {
                                            return;
                                        }
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }}
                                />
                            </label>
                        </div>
                        <div>
                            <label style={labelStyle}>상품 설명</label>
                            <textarea value={description} onChange={(event) => setDescription(event.target.value)} style={{ ...inputStyle, minHeight: '150px', marginBottom: '12px' }} />
                            <button onClick={handleGenerateDescription} disabled={aiLoading.desc} style={{ ...aiButtonStyle, width: '100%', padding: '16px' }}>
                                {aiLoading.desc ? 'AI 설명 생성 중...' : 'AI 상세 설명 만들기'}
                            </button>
                            {aiDescriptionData && (
                                <div style={{ ...aiResultBoxStyle, marginTop: '16px' }}>
                                    <h4 style={{ color: '#10b981', marginBottom: '12px' }}>AI 생성 결과</h4>
                                    <strong>추천 제목:</strong> {aiDescriptionData.ai_generated_title}
                                    <br />
                                    <strong>핵심 특징:</strong> {aiDescriptionData.ai_generated_features?.join(', ')}
                                    <br />
                                    <strong>보관 가이드:</strong> {aiDescriptionData.ai_generated_storage_guide}
                                    <br />
                                    <strong>배송 가이드:</strong> {aiDescriptionData.ai_generated_shipping_guide}
                                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#444', background: 'white', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {aiDescriptionData.ai_generated_description}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                        <button onClick={() => setDescription(aiDescriptionData.ai_generated_description || '')} style={{ ...aiButtonStyle, background: '#10b981', color: 'white' }}>
                                            설명에 반영하기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <button onClick={handleSubmit} disabled={loading} style={submitButtonStyle}>
                        {loading ? '상품 수정 중...' : '상품 수정 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', color: '#333' }}>{title}</h3>
            {children}
        </section>
    );
}

function Tab({
    active,
    icon,
    label,
    onClick,
    sub,
}: {
    active: boolean;
    icon: string;
    label: string;
    onClick: () => void;
    sub: string;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: active ? '2px solid var(--primary)' : '2px solid #eee',
                background: active ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
            }}
        >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontWeight: 700, color: active ? 'var(--primary)' : '#444' }}>{label}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{sub}</div>
        </div>
    );
}

const labelStyle: CSSProperties = { display: 'block', fontWeight: 600, marginBottom: '8px', color: '#555', fontSize: '0.95rem' };
const inputStyle: CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' };
const imageUploadStyle: CSSProperties = {
    width: '100%',
    height: '200px',
    background: '#f8fafc',
    border: '2px dashed #ddd',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative',
};
const submitButtonStyle: CSSProperties = {
    width: '100%',
    padding: '20px',
    background: 'var(--primary)',
    color: 'white',
    borderRadius: '16px',
    fontSize: '1.25rem',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 8px 16px rgba(26, 77, 46, 0.2)',
};
const aiButtonStyle: CSSProperties = {
    padding: '12px 20px',
    background: 'white',
    color: '#1e293b',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
    flex: 1,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
};
const aiResultBoxStyle: CSSProperties = {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#166534',
};
const chipButtonStyle: CSSProperties = {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    background: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer',
};
