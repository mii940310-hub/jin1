'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type WeightType = 'fixed' | 'range' | 'variable';

type WeightOption = {
    price: number;
    stock: number;
    weight: number;
};

type FarmInfo = {
    address: string | null;
    name: string | null;
};

type ProductDetail = {
    description: string | null;
    farm_id: string | null;
    farms: FarmInfo | null;
    id: string;
    image_url: string | null;
    max_weight?: number | null;
    min_weight?: number | null;
    name: string;
    price_per_kg?: number | null;
    price_total: number;
    stock_quantity?: number | null;
    weight_kg?: number | null;
    weight_options?: WeightOption[] | null;
    weight_type?: WeightType | null;
    weight_unit?: 'g' | 'kg' | null;
};

export default function ProductDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!params?.id) {
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('products')
                    .select('*, farms(name, address)')
                    .eq('id', params.id)
                    .single();

                if (fetchError) {
                    throw fetchError;
                }

                const nextProduct = data as unknown as ProductDetail;
                setProduct(nextProduct);

                if (nextProduct.weight_type === 'range' && nextProduct.weight_options?.length) {
                    setSelectedQuantity(nextProduct.weight_options[0].weight);
                } else if (nextProduct.weight_type === 'variable') {
                    setSelectedQuantity(((nextProduct.min_weight || 0) + (nextProduct.max_weight || 0)) / 2 || 1);
                } else {
                    setSelectedQuantity(nextProduct.weight_kg || 1);
                }
            } catch (caughtError) {
                const message = caughtError instanceof Error ? caughtError.message : '상품 정보를 불러오지 못했습니다.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        void fetchProduct();
    }, [params]);

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>상품 정보를 불러오는 중입니다...</div>;
    }

    if (error || !product) {
        return (
            <div className="container" style={{ paddingTop: '150px' }}>
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px' }}>
                    상품을 찾을 수 없습니다: {error}
                </div>
            </div>
        );
    }

    const weightType = product.weight_type || 'fixed';

    let baseWeight = product.weight_kg || 1;
    let baseTotalPrice = product.price_total;

    if (weightType === 'range' && product.weight_options?.length) {
        baseWeight = product.weight_options[0].weight;
        baseTotalPrice = product.weight_options[0].price;
    }

    if (weightType === 'variable') {
        const averageWeight = ((product.min_weight || 0) + (product.max_weight || 0)) / 2 || 1;
        baseWeight = averageWeight;
        baseTotalPrice = Math.round(averageWeight * (product.price_per_kg || 0));
    }

    const scaleFactor = selectedQuantity / Math.max(0.1, baseWeight);
    const currentTotalPrice = Math.round(baseTotalPrice * scaleFactor);

    const addToCart = async () => {
        setAddingToCart(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                alert('로그인이 필요합니다.');
                router.push(`/login?redirect=/products/${product.id}`);
                return;
            }

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                router.push(`/login?redirect=/products/${product.id}`);
                return;
            }

            const cartResponse = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: 1,
                    metadata: {
                        selected_option_index: weightType === 'range' ? selectedOptionIndex : null,
                        selected_quantity: selectedQuantity,
                        weight_type: weightType,
                        weight_unit: product.weight_unit || 'kg',
                    },
                }),
            });

            const cartResult = await cartResponse.json() as { message?: string; success?: boolean };

            if (!cartResponse.ok || !cartResult.success) {
                throw new Error(cartResult.message || '장바구니 담기에 실패했습니다.');
            }

            if (confirm('장바구니에 담았습니다. 장바구니로 이동할까요?')) {
                router.push('/cart');
            }
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : '장바구니 담기에 실패했습니다.';
            alert(message);
        } finally {
            setAddingToCart(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', gap: '60px' }}>
                    <div>
                        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', marginBottom: '24px' }}>
                            <Image
                                alt={product.name}
                                height={600}
                                src={product.image_url || `https://placehold.co/800x600/1a4d2e/ffffff?text=${encodeURIComponent(product.name)}`}
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                unoptimized
                                width={800}
                            />
                        </div>
                        <div style={{ background: '#f8faf8', padding: '32px', borderRadius: '16px', border: '1px solid #eefef1' }}>
                            <h2 style={{ marginBottom: '16px', color: 'var(--primary)', fontWeight: 800 }}>상품 소개</h2>
                            <p style={{ lineHeight: 1.8, color: '#444', fontSize: '1.05rem' }}>
                                {product.description || '산지에서 바로 보내는 신선한 농산물입니다.'}
                            </p>
                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eefef1', fontSize: '0.9rem', color: '#666' }}>
                                농가 정보: {product.farms?.address || '주소 정보 없음'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 24px' }}>{product.name}</h1>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'inline-block', marginBottom: '16px', background: '#ebf8ff', padding: '8px 16px', borderRadius: '20px', color: '#2b6cb0', fontSize: '0.9rem', fontWeight: 600 }}>
                                산지 직송 가격
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#e53e3e', letterSpacing: '-1px' }}>
                                    {currentTotalPrice.toLocaleString()}
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>원</span>
                                </span>
                                <span style={{ fontSize: '1.1rem', color: '#718096', textDecoration: 'line-through' }}>
                                    {Math.round(currentTotalPrice * 1.3).toLocaleString()}원
                                </span>
                            </div>
                        </div>

                        <div style={{ background: '#fffaeb', borderLeft: '4px solid #f6e05e', padding: '16px 20px', borderRadius: '0 8px 8px 0', marginBottom: '32px', color: '#744210', fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 }}>
                            산지 직송 구조를 반영한 가격으로 신선한 농산물을 더 합리적으로 만나보세요.
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#333', marginBottom: '16px' }}>구성 선택</h3>

                            {weightType === 'fixed' ? (
                                <div style={{ border: '2px solid var(--primary)', padding: '16px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>{product.weight_kg}{product.weight_unit || 'kg'}</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentTotalPrice.toLocaleString()}원</span>
                                </div>
                            ) : null}

                            {weightType === 'range' ? (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {product.weight_options?.map((option, index) => (
                                        <div
                                            key={`${option.weight}-${index}`}
                                            onClick={() => {
                                                setSelectedOptionIndex(index);
                                                setSelectedQuantity(option.weight);
                                            }}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                border: selectedOptionIndex === index ? '2px solid var(--primary)' : '1px solid #eee',
                                                background: selectedOptionIndex === index ? '#f0fdf4' : 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>{option.weight}kg</span>
                                            <div>
                                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{option.price.toLocaleString()}원</span>
                                                <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '8px' }}>재고 {option.stock}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {weightType === 'variable' ? (
                                <div style={{ border: '1px solid var(--primary)', padding: '24px', borderRadius: '16px', background: '#f0fdf4' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                                            예상 중량: {product.min_weight || 0} ~ {product.max_weight || 0}kg
                                        </span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                            kg당 {Math.round(currentTotalPrice / Math.max(selectedQuantity, 1)).toLocaleString()}원
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46', lineHeight: 1.5 }}>
                                        실제 중량에 따라 최종 금액은 조금 달라질 수 있습니다.
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <div style={{ background: '#333', color: 'white', padding: '32px', borderRadius: '16px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', opacity: 0.8, fontSize: '0.9rem' }}>
                                <span>상품 금액</span>
                                <span>{currentTotalPrice.toLocaleString()}원</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', opacity: 0.8, fontSize: '0.9rem' }}>
                                <span>배송비</span>
                                <span>+ 3,000원</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>예상 결제 금액</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{currentTotalPrice.toLocaleString()}원</div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '24px', fontSize: '1.25rem', fontWeight: 800, borderRadius: '16px', boxShadow: '0 8px 24px rgba(26,77,46,0.2)' }}
                            disabled={addingToCart}
                            onClick={() => void addToCart()}
                        >
                            {addingToCart ? '장바구니에 담는 중...' : '장바구니 담기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
