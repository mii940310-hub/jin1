'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PlatformFeePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFeeRate, setGlobalFeeRate] = useState(10); // 기본 10%
    const [bulkUpdating, setBulkUpdating] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                farm:farms(*)
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    };

    const handleUpdateIndividualFee = async (productId: string, currentFarmerPrice: number, logistics: number) => {
        const customFeeInput = prompt(`현재 상품의 수수료 금약을 입력하세요 (농가 수익: ${currentFarmerPrice}원, 물류비: ${logistics}원)`);
        if (customFeeInput === null) return;
        
        const fee = parseInt(customFeeInput, 10);
        if (isNaN(fee)) {
            alert('유효한 숫자를 입력하세요.');
            return;
        }

        const newTotalPrice = currentFarmerPrice + logistics + fee;

        const { error } = await supabase
            .from('products')
            .update({ 
                price_fee: fee,
                price_total: newTotalPrice
            })
            .eq('id', productId);

        if (error) {
            alert('수정 실패: ' + error.message);
        } else {
            alert('해당 상품의 수수료가 개별 적용되었습니다.');
            fetchProducts();
        }
    };

    const handleBulkApplyRate = async () => {
        if (!confirm(`전체 상품의 수수료를 농가 수취가의 ${globalFeeRate}% 로 일괄 조정하시겠습니까? (최종 판매가가 자동으로 변동됩니다)`)) return;
        
        setBulkUpdating(true);
        try {
            for (const product of products) {
                const newFee = Math.round(product.price_farmer * (globalFeeRate / 100));
                const newTotalPrice = product.price_farmer + product.price_logistics + newFee;

                await supabase
                    .from('products')
                    .update({
                        price_fee: newFee,
                        price_total: newTotalPrice
                    })
                    .eq('id', product.id);
            }
            alert('일괄 적용이 완료되었습니다!');
            await fetchProducts();
        } catch (e: any) {
            alert('오류 발생: ' + e.message);
        }
        setBulkUpdating(false);
    };

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem' }}>플랫폼 수수료 관리</h1>
                    <p style={{ color: 'var(--muted)', marginTop: '8px' }}>각 상품의 플랫폼 마진을 설정하고, 전체 판매가와 수수료율을 관리합니다.</p>
                </header>

                <div style={{ background: 'white', padding: '32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '8px' }}>일괄 수수료율(%) 조정</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>모든 상품의 수수료를 농가 수취가 대비 일정 %로 맞춰서 일괄 덮어씁니다.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                                type="number" 
                                value={globalFeeRate}
                                onChange={(e) => setGlobalFeeRate(Number(e.target.value))}
                                style={{ padding: '12px', width: '80px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.2rem', textAlign: 'center' }} 
                            />
                            <span style={{ fontWeight: 600 }}>%</span>
                        </div>
                        <button 
                            className="btn-primary" 
                            disabled={bulkUpdating}
                            onClick={handleBulkApplyRate}
                            style={{ padding: '12px 24px', opacity: bulkUpdating ? 0.7 : 1 }}
                        >
                            {bulkUpdating ? '반영중...' : '일괄 적용하기'}
                        </button>
                    </div>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--accent)' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>개별 상품 마진 현황 (건별 수정)</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ fontSize: '0.85rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px' }}>농가/상품명</th>
                                <th style={{ padding: '16px' }}>농가 수취가</th>
                                <th style={{ padding: '16px' }}>물류 배송비</th>
                                <th style={{ padding: '16px', background: '#fdf2f8', color: '#be185d' }}>플랫폼 수수료액</th>
                                <th style={{ padding: '16px' }}>최종 판매가</th>
                                <th style={{ padding: '16px', textAlign: 'right' }}>수정 액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>등록된 상품이 없습니다.</td></tr>
                            ) : products.map((prod: any) => {
                                const rate = ((prod.price_fee / prod.price_farmer) * 100).toFixed(1);
                                return (
                                    <tr key={prod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{prod.farm?.name || '정보없음'}</div>
                                            <div style={{ fontWeight: 600 }}>{prod.name}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>{prod.price_farmer.toLocaleString()}원</td>
                                        <td style={{ padding: '16px' }}>{prod.price_logistics.toLocaleString()}원</td>
                                        <td style={{ padding: '16px', background: '#fdf2f8', fontWeight: 700, color: '#be185d' }}>
                                            {prod.price_fee.toLocaleString()}원 <br />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({rate}%)</span>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 700 }}>{prod.price_total.toLocaleString()}원</td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleUpdateIndividualFee(prod.id, prod.price_farmer, prod.price_logistics)}
                                                style={{ padding: '6px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                개별 수정
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
