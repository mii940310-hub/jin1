'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Suspense } from 'react';

function FarmerLayoutContent({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // 회원가입 과정은 농가 권한 체크에서 예외
        if (pathname === '/farmer/register') {
            setLoading(false);
            return;
        }

        // OAuth 에러 파라미터 감지 (카카오 로그인 실패 시)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (error) {
            const msg = errorDescription
                ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
                : error;
            alert(`카카오 로그인 실패: ${msg}\n\n카카오 개발자 센터의 보안 설정을 확인해주세요.`);
            router.replace('/farmer-page');
            return;
        }

        const checkFarmer = async (userId: string) => {
            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', userId).single();
            if (!farm) {
                alert('등록된 농가 정보가 없습니다. 농가 가입을 먼저 진행해주세요.');
                router.replace('/farmer/register');
                return;
            }
            setLoading(false);
        };

        // 먼저 현재 세션 확인
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (session?.user) {
                checkFarmer(session.user.id);
            } else {
                // 세션 없으면 auth state 변화를 기다림 (OAuth 리다이렉트 직후 처리)
                let settled = false;
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
                    if (settled) return;
                    if (session?.user) {
                        settled = true;
                        checkFarmer(session.user.id);
                    } else if (event === 'INITIAL_SESSION') {
                        // INITIAL_SESSION without a user → wait for timeout
                    } else if (event === 'SIGNED_OUT') {
                        settled = true;
                        router.replace('/farmer-page');
                    }
                });

                // 3초 후에도 세션이 없으면 로그인 페이지로 이동
                const timeout = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
                        if (!session) {
                            router.replace('/farmer-page');
                        }
                    });
                }, 3000);

                return () => {
                    subscription.unsubscribe();
                    clearTimeout(timeout);
                };
            }
        });
    }, [pathname, router, searchParams]);

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>농가 권한을 확인하는 중입니다...</div>;

    return <>{children}</>;
}

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div style={{ paddingTop: '150px', textAlign: 'center' }}>로딩 중...</div>}>
            <FarmerLayoutContent>{children}</FarmerLayoutContent>
        </Suspense>
    );
}
