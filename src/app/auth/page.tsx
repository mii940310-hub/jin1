"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
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
                // 코드가 없어도 이미 로그인 된 세션이 있는지 확인 (implicit flow 대응)
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
                // 브라우저에서 exchange 해야 세션이 잡힙니다.
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
                    if (error.message.includes("both 'code' and 'code_verifier'")) {
                        // 가끔 발생하는 PKCE 충돌 시 잠시 대기 후 재시도 또는 세션 확인
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            router.replace("/update-password");
                            return;
                        }
                    }
                    setMsg(`세션 생성 실패: ${error.message}`);
                    return;
                }

                // 세션이 잡힌 뒤 비밀번호 변경 페이지로 이동
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
