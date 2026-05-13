'use client';

import { Suspense, type ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function FarmerLayoutContent({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isRegisterRoute = pathname === '/farmer/register';
    const [loading, setLoading] = useState(!isRegisterRoute);

    useEffect(() => {
        if (isRegisterRoute) {
            return;
        }

        let isActive = true;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let unsubscribe: (() => void) | null = null;

        const handleUnauthorized = () => {
            if (!isActive) {
                return;
            }
            router.replace('/farmer-page');
        };

        const checkFarmer = async (userId: string) => {
            const { data: farm } = await supabase
                .from('farms')
                .select('id')
                .eq('owner_id', userId)
                .maybeSingle();

            if (!isActive) {
                return;
            }

            if (!farm) {
                alert('등록된 농가 정보가 없습니다. 먼저 농가 등록을 진행해 주세요.');
                router.replace('/farmer/register');
                return;
            }

            setLoading(false);
        };

        const initialize = async () => {
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                const message = errorDescription
                    ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
                    : error;

                alert(`카카오 로그인에 실패했습니다: ${message}\n\n카카오 개발자센터 보안 설정을 확인해 주세요.`);
                router.replace('/farmer-page');
                return;
            }

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
                await checkFarmer(session.user.id);
                return;
            }

            const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession: Session | null) => {
                if (!isActive) {
                    return;
                }

                if (nextSession?.user) {
                    void checkFarmer(nextSession.user.id);
                    return;
                }

                if (event === 'SIGNED_OUT') {
                    handleUnauthorized();
                }
            });

            unsubscribe = () => data.subscription.unsubscribe();

            timeoutId = setTimeout(async () => {
                const {
                    data: { session: latestSession },
                } = await supabase.auth.getSession();

                if (!latestSession) {
                    handleUnauthorized();
                }
            }, 3000);
        };

        void initialize();

        return () => {
            isActive = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            unsubscribe?.();
        };
    }, [isRegisterRoute, router, searchParams]);

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>농가 권한을 확인하고 있습니다...</div>;
    }

    return <>{children}</>;
}

export default function FarmerLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<div style={{ paddingTop: '150px', textAlign: 'center' }}>로딩 중입니다...</div>}>
            <FarmerLayoutContent>{children}</FarmerLayoutContent>
        </Suspense>
    );
}
