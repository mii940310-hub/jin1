'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.';
}

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('인증 정보를 확인하고 있습니다...');

    useEffect(() => {
        const run = async () => {
            const code = searchParams.get('code');
            const errorCode = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (errorCode) {
                setMessage(`인증 실패: ${errorDescription || errorCode}`);
                setTimeout(() => router.push('/forgot-password'), 3000);
                return;
            }

            if (!code) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session) {
                    router.replace('/update-password');
                } else {
                    setMessage('유효하지 않은 링크입니다. 로그인 페이지로 이동합니다.');
                    setTimeout(() => router.push('/login'), 3000);
                }

                return;
            }

            try {
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
                    if (error.message.includes("both 'code' and 'code_verifier'")) {
                        const {
                            data: { session },
                        } = await supabase.auth.getSession();

                        if (session) {
                            router.replace('/update-password');
                            return;
                        }
                    }

                    setMessage(`세션 생성 실패: ${error.message}`);
                    return;
                }

                router.replace('/update-password');
            } catch (error: unknown) {
                setMessage(`오류 발생: ${getErrorMessage(error)}`);
            }
        };

        void run();
    }, [router, searchParams]);

    return (
        <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--background)' }}>
            <div
                style={{
                    padding: '32px',
                    borderRadius: 'var(--radius)',
                    background: 'white',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                    textAlign: 'center',
                }}
            >
                <div className="loading-spinner" style={{ marginBottom: '16px' }} />
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{message}</div>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--background)' }}>
                    <div>인증 정보를 불러오는 중입니다...</div>
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
