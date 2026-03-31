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
    
    // 무게 방식 및 단위
    const [weightType, setWeightType] = useState<'fixed' | 'range' | 'variable'>('fixed');
    const [weightUnit, setWeightUnit] = useState<'g' | 'kg'>('kg');
    
    // 고정 중량형 (Fixed)
    const [fixedWeight, setFixedWeight] = useState(1);
    const [basePrice, setBasePrice] = useState<number | ''>(''); // Farm 수취액

    // 구간형/세트형 (Range)
    const [weightOptions, setWeightOptions] = useState<{weight: number, price: number, stock: number}[]>([
        { weight: 3, price: 15000, stock: 100 }
    ]);

    // 가변형 (Variable)
    const [minWeight, setMinWeight] = useState(8);
    const [maxWeight, setMaxWeight] = useState(10);
    const [pricePerKg, setPricePerKg] = useState(1500);
    
    const [loading, setLoading] = useState(false);
    const [farmId, setFarmId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [aiDescriptionData, setAiDescriptionData] = useState<any>(null);
    const [aiSpecsData, setAiSpecsData] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState({ desc: false, specs: false });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }
            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();
            if (farm) setFarmId(farm.id);
        };
        checkUser();
    }, [router]);

    const addOption = () => {
        setWeightOptions([...weightOptions, { weight: 0, price: 0, stock: 100 }]);
    };

    const removeOption = (index: number) => {
        setWeightOptions(weightOptions.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: string, value: number) => {
        const newOptions = [...weightOptions];
        (newOptions[index] as any)[field] = value;
        setWeightOptions(newOptions);
    };

    const applyTemplate = (type: string) => {
        if (type === 'potato') {
            setName('강원도 고랭지 수확 감자 (박스)');
            setWeightType('range');
            setWeightOptions([
                { weight: 3, price: 12000, stock: 100 },
                { weight: 5, price: 18000, stock: 100 },
                { weight: 10, price: 32000, stock: 50 }
            ]);
        } else if (type === 'cabbage') {
            setName('정선 고랭지 배추 (박스형)');
            setWeightType('variable');
            setMinWeight(8);
            setMaxWeight(10);
            setPricePerKg(1800);
        }
    };

    const handleGenerateDescription = async () => {
        setAiLoading(prev => ({ ...prev, desc: true }));
        try {
            const res = await fetch('/api/ai/product-description', {
                method: 'POST', body: JSON.stringify({ name, category, harvestDate, description })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAiDescriptionData(data);
            alert("AI 상세 설명초안이 생성되었습니다.");
        } catch (e: any) { alert(`상세 설명 생성 실패: ${e.message}`); }
        setAiLoading(prev => ({ ...prev, desc: false }));
    };



    const handleStandardizeSpecs = async () => {
        setAiLoading(prev => ({ ...prev, specs: true }));
        try {
            const res = await fetch('/api/ai/standardize-specs', {
                method: 'POST', body: JSON.stringify({ name, weightType, minWeight, maxWeight, fixedWeight, weightUnit, description })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAiSpecsData(data);
            alert("규격 표준화 데이터가 생성되었습니다.");
        } catch (e: any) { alert(`규격 표준화 실패: ${e.message}`); }
        setAiLoading(prev => ({ ...prev, specs: false }));
    };

    const handleRegister = async () => {
        if (!name || !harvestDate) {
            alert('필수 정보를 입력해주세요.');
            return;
        }
        if (!farmId) {
            alert('농가 정보 연동 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setLoading(true);

        let imageUrl = null;
        if (imageFile) {
            const ext = imageFile.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
            const filePath = `${farmId}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, imageFile);
            if (!uploadError) {
                const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);
                imageUrl = publicUrlData.publicUrl;
            }
        }

        // 공통 물류비(박스 포장비 등, 택배비 별도)
        const packagingFee = 1500;
        
        let payload: any = {
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
            ai_applied: !!(aiDescriptionData || aiSpecsData),
        };

        if (weightType === 'fixed') {
            const finalTotal = Number(basePrice) || 0;
            payload.weight_kg = weightUnit === 'kg' ? fixedWeight : fixedWeight / 1000;
            payload.price_total = finalTotal;
            payload.price_fee = Math.round(finalTotal * 0.1);
            payload.price_farmer = finalTotal - payload.price_fee - packagingFee;
            payload.stock_quantity = 100;
        } else if (weightType === 'range') {
            const modifiedOptions = weightOptions.map(opt => {
                const optFee = Math.round(opt.price * 0.1);
                return { ...opt, price_farmer: opt.price - optFee - packagingFee };
            });
            payload.weight_options = modifiedOptions;

            const first = modifiedOptions[0];
            payload.weight_kg = first.weight;
            payload.price_total = first.price;
            payload.price_fee = Math.round(first.price * 0.1);
            payload.price_farmer = first.price - payload.price_fee - packagingFee;
            payload.stock_quantity = modifiedOptions.reduce((acc, cur) => acc + cur.stock, 0);
        } else if (weightType === 'variable') {
            payload.min_weight = minWeight;
            payload.max_weight = maxWeight;
            payload.price_per_kg = pricePerKg; // AI price per kg
            
            const avgW = (minWeight + maxWeight) / 2;
            const finalTotal = Math.round(avgW * pricePerKg);
            
            payload.weight_kg = avgW;
            payload.price_total = finalTotal;
            payload.price_fee = Math.round(finalTotal * 0.1);
            payload.price_farmer = finalTotal - payload.price_fee - packagingFee;
            payload.stock_quantity = 100;
        }

        const { error } = await supabase.from("products").insert(payload);

        if (error) {
            alert(`등록 실패: ${error.message}`);
            setLoading(false);
            return;
        }

        alert("상품 등록 완료!");
        router.push('/farmer');
    };

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px', background: '#f9fbf9' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>상품 등록</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => applyTemplate('potato')} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', fontSize: '0.9rem', cursor: 'pointer' }}>🥔 감자 템플릿</button>
                        <button onClick={() => applyTemplate('cabbage')} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', fontSize: '0.9rem', cursor: 'pointer' }}>🥬 배추 템플릿</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '24px' }}>
                    {/* 기본 정보 */}
                    <Card title="기본 정보">
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>상품명</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="상품명을 입력하세요" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>카테고리</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={inputStyle}>
                                    <option value="vegetable">채소</option>
                                    <option value="grain">곡물</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>수확 예정일</label>
                                <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    </Card>

                    {/* 무게 방식 선택 */}
                    <Card title="무게 및 가격 설정">
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <Tab active={weightType === 'fixed'} onClick={() => setWeightType('fixed')} icon="📦" label="고정 중량형" sub="쌀, 잡곡 등" />
                            <Tab active={weightType === 'range'} onClick={() => setWeightType('range')} icon="⚖️" label="구간형 (세트)" sub="감자, 고구마 등" />
                            <Tab active={weightType === 'variable'} onClick={() => setWeightType('variable')} icon="🚛" label="가변형 (실중량)" sub="배추, 무 등" />
                        </div>

                        {weightType === 'fixed' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px', alignItems: 'flex-end' }}>
                                <div>
                                    <label style={labelStyle}>중량</label>
                                    <input type="number" value={fixedWeight} onChange={(e) => setFixedWeight(Number(e.target.value))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>단위</label>
                                    <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as any)} style={inputStyle}>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>최종 판매가 (박스당)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} placeholder="가격을 입력하세요" style={inputStyle} />
                                        <span style={{ position: 'absolute', right: '12px', top: '12px', color: '#888' }}>원</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {weightType === 'range' && (
                            <div>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>* 소비자에게 다양한 선택지를 제공하세요 (최대 10kg 제한)</span>
                                    <button onClick={addOption} style={{ color: 'var(--primary)', fontWeight: 700, background: 'none' }}>+ 옵션 추가</button>
                                </div>
                                {weightOptions.map((opt, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 40px', gap: '12px', marginBottom: '12px', alignItems: 'center', background: '#f8faf8', padding: '12px', borderRadius: '8px' }}>
                                        <input type="number" value={opt.weight} onChange={(e) => updateOption(i, 'weight', Number(e.target.value))} placeholder="무게(kg)" style={inputStyle} />
                                        <input type="number" value={opt.price} onChange={(e) => updateOption(i, 'price', Number(e.target.value))} placeholder="가격을 입력하세요" style={inputStyle} />
                                        <input type="number" value={opt.stock} onChange={(e) => updateOption(i, 'stock', Number(e.target.value))} placeholder="재고" style={inputStyle} />
                                        <button onClick={() => removeOption(i)} style={{ color: '#ff4d4f', fontSize: '1.2rem', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {weightType === 'variable' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={labelStyle}>최소 무게 (kg)</label>
                                        <input type="number" value={minWeight} onChange={(e) => setMinWeight(Number(e.target.value))} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>최대 무게 (kg)</label>
                                        <input type="number" value={maxWeight} onChange={(e) => setMaxWeight(Number(e.target.value))} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>kg당 가격</label>
                                        <input type="number" value={pricePerKg} onChange={(e) => setPricePerKg(Number(e.target.value))} placeholder="가격을 입력하세요" style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ background: '#eefef1', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#065f46' }}>
                                        💡 <strong>예상 가격:</strong> {Math.round(minWeight * pricePerKg).toLocaleString()}원 ~ {Math.round(maxWeight * pricePerKg).toLocaleString()}원
                                    </p>
                                    <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#666' }}>* 소비자는 해당 범위 내에서 실측 무게에 따라 결제하게 됩니다.</p>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                            <button onClick={handleStandardizeSpecs} disabled={aiLoading.specs} style={{...aiButtonStyle, width: '100%'}}>
                                {aiLoading.specs ? '📦 정리 중...' : '📦 규격 자동 정리'}
                            </button>
                        </div>
                        {aiSpecsData && (
                            <div style={aiResultBoxStyle}>
                                <strong>표준 규격 안내:</strong> {aiSpecsData.ai_standardized_spec}<br/>
                                <strong>수량 가이드:</strong> {aiSpecsData.ai_quantity_guide}<br/>
                                <strong>혼동 방지 알림:</strong> <span style={{color: '#d97706'}}>{aiSpecsData.ai_confusion_warning}</span>
                            </div>
                        )}
                    </Card>

                    {/* 사진 및 상세설명 */}
                    <Card title="상세 정보">
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>상품 사진</label>
                            <label style={imageUploadStyle}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ color: '#888' }}>📷 사진 등록하기</span>
                                )}
                                <input type="file" style={{ display: 'none' }} onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }} />
                            </label>
                        </div>
                        <div>
                            <label style={labelStyle}>상품 설명 (자유 입력용)</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상품의 기초 구성 정보만 대략적으로 적어주시면 AI가 멋지게 완성해드립니다." style={{ ...inputStyle, minHeight: '150px', marginBottom: '12px' }} />
                            
                            <button onClick={handleGenerateDescription} disabled={aiLoading.desc} style={{ ...aiButtonStyle, width: '100%', padding: '16px' }}>
                                {aiLoading.desc ? '🤖 AI가 설명과 가이드를 정리하고 있습니다...' : '🤖 AI로 구매력 높은 상세 페이지 생성하기'}
                            </button>
                            
                            {aiDescriptionData && (
                                <div style={{ ...aiResultBoxStyle, marginTop: '16px' }}>
                                    <h4 style={{ color: '#10b981', marginBottom: '12px' }}>✨ AI 생성 결과</h4>
                                    <strong>추천 타이틀:</strong> {aiDescriptionData.ai_generated_title}<br/>
                                    <strong>핵심 특징:</strong> {aiDescriptionData.ai_generated_features?.join(', ')}<br/>
                                    <strong style={{ display: 'block', marginTop: '12px' }}>보관 / 배송 가이드:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{aiDescriptionData.ai_generated_storage_guide}</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{aiDescriptionData.ai_generated_shipping_guide}</p>
                                    
                                    <strong style={{ display: 'block', marginTop: '12px' }}>상세 설명 초안:</strong>
                                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#444', background: 'white', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {aiDescriptionData.ai_generated_description}
                                    </p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                        <button onClick={() => setDescription(aiDescriptionData.ai_generated_description)} style={{...aiButtonStyle, background: '#10b981', color: 'white'}}>
                                            본문에 초안 덮어쓰기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <button onClick={handleRegister} disabled={loading} style={submitButtonStyle}>
                        {loading ? '상품 등록 중...' : '상품 등록 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// UI Components
function Card({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <section style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', color: '#333' }}>{title}</h3>
            {children}
        </section>
    );
}

function Tab({ active, icon, label, sub, onClick }: any) {
    return (
        <div onClick={onClick} style={{
            flex: 1, padding: '16px', borderRadius: '12px', border: active ? '2px solid var(--primary)' : '2px solid #eee',
            background: active ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
        }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontWeight: 700, color: active ? 'var(--primary)' : '#444' }}>{label}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{sub}</div>
        </div>
    );
}

// Styles
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, marginBottom: '8px', color: '#555', fontSize: '0.95rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' };
const imageUploadStyle: React.CSSProperties = {
    width: '100%', height: '200px', background: '#f8fafc', border: '2px dashed #ddd', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
};
const submitButtonStyle: React.CSSProperties = {
    width: '100%', padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '16px',
    fontSize: '1.25rem', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: '20px', boxShadow: '0 8px 16px rgba(26, 77, 46, 0.2)'
};
const aiButtonStyle: React.CSSProperties = {
    padding: '12px 20px', background: 'white', color: '#1e293b', border: '1px solid #cbd5e1', 
    borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flex: 1,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};
const aiResultBoxStyle: React.CSSProperties = {
    background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px', 
    marginTop: '16px', fontSize: '0.95rem', lineHeight: '1.6', color: '#166534'
};

