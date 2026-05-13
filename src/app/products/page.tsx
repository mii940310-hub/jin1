'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ProductListItem = {
    farms: { name: string | null } | null;
    id: string;
    image_url: string | null;
    name: string;
    price_per_kg?: number | null;
    price_total: number;
    weight_type?: 'fixed' | 'range' | 'variable' | null;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<ProductListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('products')
                    .select('id, name, image_url, price_total, price_per_kg, weight_type, farms(name)');

                if (fetchError) {
                    throw fetchError;
                }

                setProducts((data ?? []) as unknown as ProductListItem[]);
            } catch (caughtError) {
                const message = caughtError instanceof Error ? caughtError.message : '상품 목록을 불러오지 못했습니다.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        void fetchProducts();
    }, []);

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>상품을 불러오고 있습니다...</div>;
    }

    if (error) {
        return (
            <div className="container" style={{ paddingTop: '150px' }}>
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px' }}>
                    데이터 로드 실패: {error}
                    <br />
                    Supabase 연결 상태를 확인해 주세요.
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px' }}>
            <div className="container">
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>신선한 산지 직송 상품</h1>
                    <p style={{ color: 'var(--muted)' }}>지금 판매 중인 상품은 총 {products.length}개입니다.</p>
                </header>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        등록된 상품이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
                        {products.map((product) => {
                            const priceLabel = product.weight_type === 'variable'
                                ? `${(product.price_per_kg || 0).toLocaleString()}원 / kg`
                                : `${product.price_total.toLocaleString()}원`;

                            const typeLabel = product.weight_type === 'variable'
                                ? '가변 중량'
                                : product.weight_type === 'range'
                                    ? '옵션 선택'
                                    : '고정 중량';

                            return (
                                <Link key={product.id} href={`/products/${product.id}`}>
                                    <div
                                        style={{
                                            background: 'white',
                                            borderRadius: 'var(--radius)',
                                            overflow: 'hidden',
                                            boxShadow: 'var(--shadow-sm)',
                                            border: '1px solid var(--border)',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        className="product-card-hover"
                                    >
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '250px',
                                                background: '#f5f5f5',
                                                backgroundImage: `url(${product.image_url || `https://placehold.co/600x400/1a4d2e/ffffff?text=${encodeURIComponent(product.name)}`})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                        <div style={{ padding: '24px' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>
                                                {product.farms?.name || '공급 농가'}
                                            </p>
                                            <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{product.name}</h2>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{priceLabel}</span>
                                                <span
                                                    style={{
                                                        background: product.weight_type === 'variable' ? '#fdf2f2' : product.weight_type === 'range' ? '#f0fdf4' : 'var(--accent)',
                                                        color: product.weight_type === 'variable' ? '#991b1b' : product.weight_type === 'range' ? '#166534' : 'inherit',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {typeLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
