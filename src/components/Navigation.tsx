'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const [userRole, setUserRole] = useState<'guest' | 'user' | 'farmer' | 'admin'>('guest');
    const pathname = usePathname();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
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
            if (profile?.role === 'farmer') {
                setUserRole('farmer');
            } else {
                setUserRole('user');
            }
        };
        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (session?.user) {
                checkUser();
            } else {
                setUserRole('guest');
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="nav-links" style={{ display: 'flex', gap: '32px', fontWeight: 500, alignItems: 'center' }}>
            <Link href="/">홈</Link>
            <Link href="/products">상품</Link>
            <Link href="/farmer-page">농가</Link>
            <a href="#about" onClick={(e) => {
                e.preventDefault();
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
            }}>소개</a>

            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 8px' }} />

            <Link href="/cart">🛒 장바구니</Link>
            
            {/* 일반 사용자/권한없는 사용자용 메뉴 */}
            {userRole !== 'admin' && userRole !== 'farmer' && (
                <>
                    <Link href="/my-page/orders">마이페이지</Link>
                </>
            )}

            {/* 농가 전용 메뉴 */}
            {userRole === 'farmer' && (
                <>
                    <Link href="/farmer">농가 관리 홈</Link>
                </>
            )}

            {/* 관리자 전용 메뉴 */}
            {userRole === 'admin' && (
                <Link href="/admin" style={{ color: '#be185d' }}>총괄 대시보드</Link>
            )}

            {/* 로그인 / 로그아웃 */}
            {userRole === 'guest' ? (
                <Link href="/login" style={{ 
                    padding: '8px 20px', 
                    borderRadius: '20px', 
                    background: 'var(--primary)', 
                    color: 'white',
                    fontSize: '0.9rem'
                }}>로그인</Link>
            ) : (
                <button 
                    onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/';
                    }} 
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontWeight: 500, fontSize: '1rem' }}
                >
                    로그아웃
                </button>
            )}
        </div>
    );
}
