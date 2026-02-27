'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase.from('products').select('*, farms(name)');
                if (error) throw error;
                setProducts(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>상품을 불러고 있습니다...</div>;
    if (error) return (
        <div className="container" style={{ paddingTop: '150px' }}>
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px' }}>
                ⚠️ 데이터 로드 실패: {error}
                <br />
                Supabase 연결 및 RLS 정책을 확인하세요.
            </div>
        </div>
    );

    return (
        <div className="fade-in" style={{ paddingTop: '100px' }}>
            <div className="container">
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>신선한 고랭지 산물</h1>
                    <p style={{ color: 'var(--muted)' }}>강원도의 깨끗한 공기와 맑은 물로 키운 농산물입니다 ({products.length}개)</p>
                </header>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        등록된 상품이 없습니다. /debug 페이지에서 연결을 테스트하거나 농가 홈에서 상품을 등록하세요.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '32px'
                    }}>
                        {products.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`}>
                                <div style={{
                                    background: 'white',
                                    borderRadius: 'var(--radius)',
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-sm)',
                                    border: '1px solid var(--border)',
                                    transition: 'transform 0.2s ease'
                                }} className="product-card-hover">
                                    <div style={{
                                        width: '100%',
                                        height: '250px',
                                        background: '#f5f5f5',
                                        backgroundImage: `url(${product.image_url || 'https://placehold.co/600x400/1a4d2e/ffffff?text=' + product.name})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }} />
                                    <div style={{ padding: '24px' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>{product.farms?.name || '공급 농가'}</p>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{product.name}</h3>
                                        {/* Optional tags can go here */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{product.price_total.toLocaleString()}원</span>
                                            <span style={{
                                                background: 'var(--accent)',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>{product.category === 'vegetable' ? '채소' : '곡물'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
