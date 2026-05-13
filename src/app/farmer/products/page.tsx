'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type FarmerProduct = {
    category: 'grain' | 'vegetable' | string | null;
    id: string;
    image_url: string | null;
    name: string;
    price_total: number;
    stock_quantity: number | null;
    weight_kg: number | null;
};

export default function FarmerProductsPage() {
    const [products, setProducts] = useState<FarmerProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    setProducts([]);
                    return;
                }

                const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).maybeSingle();

                if (!farm) {
                    setProducts([]);
                    return;
                }

                const { data } = await supabase
                    .from('products')
                    .select('id, name, category, image_url, weight_kg, stock_quantity, price_total')
                    .eq('farm_id', farm.id)
                    .order('created_at', { ascending: false });

                setProducts((data ?? []) as FarmerProduct[]);
            } finally {
                setLoading(false);
            }
        };

        void fetchProducts();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`정말로 '${name}' 상품을 삭제하시겠습니까?`)) {
            return;
        }

        const { error } = await supabase.from('products').delete().eq('id', id);

        if (error) {
            alert(`삭제에 실패했습니다: ${error.message}`);
            return;
        }

        alert('상품을 삭제했습니다.');
        setProducts((previous) => previous.filter((product) => product.id !== id));
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '2.5rem' }}>상품 관리</h1>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Link
                            href="/farmer/auto-sell"
                            style={{
                                background: '#eef6f0',
                                border: '1px solid #b8d3bf',
                                borderRadius: '999px',
                                color: '#1f5132',
                                fontWeight: 700,
                                padding: '12px 18px',
                            }}
                        >
                            AI 초간편 등록
                        </Link>
                        <Link className="btn-primary" href="/farmer/register-product">+ 신규 상품 등록</Link>
                    </div>
                </header>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        등록된 상품이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {products.map((product) => (
                            <article key={product.id} style={{ display: 'flex', gap: '24px', padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                                <div
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '8px',
                                        background: '#eee',
                                        backgroundImage: `url(${product.image_url || `https://placehold.co/200?text=${encodeURIComponent(product.name)}`})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>
                                        {product.category === 'vegetable' ? '채소' : '곡물'}
                                        {product.weight_kg ? ` | ${product.weight_kg}kg` : ''}
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{product.name}</h2>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '16px' }}>재고: {product.stock_quantity ?? 0}박스</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>총 판매가: {product.price_total.toLocaleString()}원</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                                    <Link className="btn-outline" href={`/farmer/products/${product.id}/edit`} style={{ padding: '8px 16px', textAlign: 'center' }}>
                                        수정
                                    </Link>
                                    <button
                                        onClick={() => void handleDelete(product.id, product.name)}
                                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                        type="button"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
