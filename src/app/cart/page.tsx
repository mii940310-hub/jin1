'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CartPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function loadCart() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch cart from DB
                const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();
                if (cart) {
                    const { data: cartItems } = await supabase
                        .from('cart_items')
                        .select('*, products(*)')
                        .eq('cart_id', cart.id);
                    setItems(cartItems || []);
                }
            }
            setLoading(false);
        }
        loadCart();
    }, []);

    const total = items.reduce((acc, item) => acc + (item.products.price_total * item.quantity), 0);
    const shipping = items.length > 0 ? 3000 : 0;

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>장바구니 확인 중...</div>;

    if (!user) return (
        <div style={{ paddingTop: '150px' }} className="container">
            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--accent)', borderRadius: 'var(--radius)' }}>
                <h2>로그인이 필요합니다</h2>
                <p style={{ margin: '16px 0 24px', color: 'var(--muted)' }}>장바구니를 이용하시려면 로그인해 주세요.</p>
                <Link href="/login" className="btn-primary">로그인하러 가기</Link>
            </div>
        </div>
    );

    return (
        <div className="fade-in" style={{ paddingTop: '120px' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>장바구니</h1>

                <div style={{ display: 'grid', gridTemplateColumns: items.length > 0 ? '1.5fr 1fr' : '1fr', gap: '40px' }}>
                    {/* Item List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {items.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                장바구니가 비어 있습니다.
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    gap: '20px',
                                    background: 'white',
                                    padding: '24px',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        background: '#eee',
                                        borderRadius: '8px',
                                        backgroundImage: `url(${item.products.image_url || 'https://placehold.co/200x200?text=' + item.products.name})`,
                                        backgroundSize: 'cover'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.products.name}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span>수량: {item.quantity}</span>
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{(item.products.price_total * item.quantity).toLocaleString()}원</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary */}
                    {items.length > 0 && (
                        <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
                            <div style={{ background: 'var(--accent)', padding: '32px', borderRadius: 'var(--radius)' }}>
                                <h3 style={{ marginBottom: '24px' }}>결제 상세</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)' }}>주문 금액</span>
                                        <span>{total.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)' }}>배송비</span>
                                        <span>+ {shipping.toLocaleString()}원</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                                        <span>총 결제 금액</span>
                                        <span style={{ color: 'var(--primary)' }}>{(total + shipping).toLocaleString()}원</span>
                                    </div>
                                </div>
                                <button className="btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => alert('결제 연동이 필요합니다.')}>
                                    주문하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
