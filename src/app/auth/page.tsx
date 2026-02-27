"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [msg, setMsg] = useState("세션 확인 중...");

    useEffect(() => {
        const run = async () => {
            const code = searchParams.get("code");
            const errorCode = searchParams.get("error");
            const errorDescription = searchParams.get("error_description");

            if (errorCode) {
                setMsg(`인증 실패: ${errorDescription || errorCode}`);
                setTimeout(() => router.push('/forgot-password'), 3000);
                return;
            }

            if (!code) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.replace("/update-password");
                } else {
                    setMsg("유효하지 않은 접근입니다. 인증 코드가 없습니다. 잠시 후 로그인 페이지로 이동합니다.");
                    setTimeout(() => router.push('/login'), 3000);
                }
                return;
            }

            try {
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
                    if (error.message.includes("both 'code' and 'code_verifier'")) {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            router.replace("/update-password");
                            return;
                        }
                    }
                    setMsg(`세션 생성 실패: ${error.message}`);
                    return;
                }

                router.replace("/update-password");
            } catch (err: any) {
                setMsg(`오류 발생: ${err.message}`);
            }
        };

        run();
    }, [router, searchParams]);

    return (
        <div style={{ display: "grid", placeItems: "center", height: "100vh", background: 'var(--background)' }}>
            <div style={{
                padding: '32px',
                borderRadius: 'var(--radius)',
                background: 'white',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
                textAlign: 'center'
            }}>
                <div className="loading-spinner" style={{ marginBottom: '16px' }}></div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{msg}</div>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div style={{ display: "grid", placeItems: "center", height: "100vh", background: 'var(--background)' }}>
                <div>인증 정보를 불러오는 중입니다...</div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
