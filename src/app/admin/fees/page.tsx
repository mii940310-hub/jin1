'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ProductFeeRow = {
    id: string;
    name: string;
    price_farmer: number;
    price_logistics: number;
    price_fee: number;
    price_total: number;
    farm: { name: string } | null;
};

const GLOBAL_FEE_RATE = 10;

export default function PlatformFeePage() {
    const [products, setProducts] = useState<ProductFeeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulkUpdating, setBulkUpdating] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price_farmer, price_logistics, price_fee, price_total, farm:farms(name)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProducts(data as unknown as ProductFeeRow[]);
        }

        setLoading(false);
    };

    useEffect(() => {
        void fetchProducts();
    }, []);

    const handleBulkApplyRate = async () => {
        const confirmed = confirm(`전체 상품의 수수료를 농가 출고가의 ${GLOBAL_FEE_RATE}%로 다시 계산할까요?`);
        if (!confirmed) {
            return;
        }

        setBulkUpdating(true);
        try {
            for (const product of products) {
                const newFee = Math.round(product.price_farmer * (GLOBAL_FEE_RATE / 100));
                const newTotalPrice = product.price_farmer + product.price_logistics + newFee;

                await supabase
                    .from('products')
                    .update({
                        price_fee: newFee,
                        price_total: newTotalPrice,
                    })
                    .eq('id', product.id);
            }

            alert('수수료 일괄 적용이 완료되었습니다.');
            await fetchProducts();
        } catch (error) {
            const message = error instanceof Error ? error.message : '수수료 적용 중 오류가 발생했습니다.';
            alert(message);
        } finally {
            setBulkUpdating(false);
        }
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem' }}>플랫폼 수수료 관리</h1>
                    <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
                        전체 상품의 수수료와 최종 판매가를 한 번에 관리할 수 있습니다.
                    </p>
                </header>

                <div
                    style={{
                        background: 'white',
                        padding: '32px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        marginBottom: '32px',
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '8px' }}>고정 수수료율</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                            현재 모든 상품은 농가 출고가 기준 10% 수수료 정책을 사용합니다.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                background: '#f1f5f9',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>10</span>
                            <span style={{ fontWeight: 600 }}>%</span>
                        </div>
                        <button
                            className="btn-primary"
                            disabled={bulkUpdating}
                            onClick={handleBulkApplyRate}
                            style={{ padding: '12px 24px', opacity: bulkUpdating ? 0.7 : 1 }}
                        >
                            {bulkUpdating ? '반영 중...' : '전체 상품에 적용'}
                        </button>
                    </div>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--accent)' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>상품별 수수료 현황</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ fontSize: '0.85rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px' }}>농가 / 상품명</th>
                                <th style={{ padding: '16px' }}>농가 출고가</th>
                                <th style={{ padding: '16px' }}>물류비</th>
                                <th style={{ padding: '16px', background: '#fdf2f8', color: '#be185d' }}>수수료</th>
                                <th style={{ padding: '16px' }}>최종 판매가</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                                        등록된 상품이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const rate = product.price_farmer > 0
                                        ? ((product.price_fee / product.price_farmer) * 100).toFixed(1)
                                        : '0.0';

                                    return (
                                        <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                    {product.farm?.name || '농가 정보 없음'}
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{product.name}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>{product.price_farmer.toLocaleString()}원</td>
                                            <td style={{ padding: '16px' }}>{product.price_logistics.toLocaleString()}원</td>
                                            <td style={{ padding: '16px', background: '#fdf2f8', fontWeight: 700, color: '#be185d' }}>
                                                {product.price_fee.toLocaleString()}원
                                                <br />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({rate}%)</span>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 700 }}>{product.price_total.toLocaleString()}원</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
