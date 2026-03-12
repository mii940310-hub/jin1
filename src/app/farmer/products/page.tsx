'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function FarmerProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();
            if (farm) {
                const { data } = await supabase.from('products').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false });
                setProducts(data || []);
            }
            setLoading(false);
        }
        fetchProducts();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`정말로 '${name}' 상품을 삭제하시겠습니까?`)) return;
        
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            alert('삭제에 실패했습니다: ' + error.message);
        } else {
            alert('상품이 삭제되었습니다.');
            setProducts(products.filter(p => p.id !== id));
        }
    };

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem' }}>상품 관리</h1>
                    <Link href="/farmer/register-product" className="btn-primary">+ 신규 상품 등록</Link>
                </header>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                        등록된 상품이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {products.map(product => (
                            <div key={product.id} style={{ display: 'flex', gap: '24px', padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '8px', background: '#eee',
                                    backgroundImage: `url(${product.image_url || 'https://placehold.co/200?text=' + product.name})`,
                                    backgroundSize: 'cover'
                                }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>
                                        {product.category === 'vegetable' ? '채소' : '곡물'} | {product.weight_kg}kg
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{product.name}</h3>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '16px' }}>재고: {product.stock_quantity}박스</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>총 판매가: {product.price_total.toLocaleString()}원</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                                    <Link href={`/farmer/products/${product.id}/edit`} className="btn-outline" style={{ padding: '8px 16px', textAlign: 'center' }}>수정</Link>
                                    <button onClick={() => handleDelete(product.id, product.name)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
