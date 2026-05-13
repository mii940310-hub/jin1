'use client';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'farmer' | 'guest' | 'user';

export default function Navigation() {
    const [userRole, setUserRole] = useState<UserRole>('guest');

    useEffect(() => {
        if (!isSupabaseConfigured) {
            return;
        }

        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setUserRole('guest');
                return;
            }

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@highlandfresh.com';

            if (user.email === adminEmail) {
                setUserRole('admin');
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            setUserRole(profile?.role === 'farmer' ? 'farmer' : 'user');
        };

        void checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                if (!session?.user) {
                    setUserRole('guest');
                    return;
                }

                void checkUser();
            },
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="nav-links" style={{ alignItems: 'center', display: 'flex', fontWeight: 500, gap: '32px' }}>
            <Link href="/">홈</Link>
            <Link href="/products">상품</Link>
            <Link href="/farmer-page">농가</Link>
            <Link href="/about">소개</Link>

            <div style={{ background: 'var(--border)', height: '20px', margin: '0 8px', width: '1px' }} />

            <Link href="/cart">장바구니</Link>

            {userRole !== 'admin' && userRole !== 'farmer' ? <Link href="/my-page/orders">주문내역</Link> : null}
            {userRole === 'farmer' ? <Link href="/farmer">농가 관리</Link> : null}
            {userRole === 'admin' ? <Link href="/admin" style={{ color: '#be185d' }}>관리자</Link> : null}

            {userRole === 'guest' ? (
                <Link
                    href="/login"
                    style={{
                        background: 'var(--primary)',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '0.9rem',
                        padding: '8px 20px',
                    }}
                >
                    로그인
                </Link>
            ) : (
                <button
                    onClick={async () => {
                        if (!isSupabaseConfigured) {
                            return;
                        }

                        await supabase.auth.signOut();
                        window.location.href = '/';
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}
                    type="button"
                >
                    로그아웃
                </button>
            )}
        </div>
    );
}
