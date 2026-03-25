'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FarmerPage() {
    const [loading, setLoading] = useState(false);
    const handleKakaoLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/farmer`,
            },
        });
        if (error) {
            alert('카카오 로그인 중 오류가 발생했습니다: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--background)' }}>
            <div className="container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
                {/* 1. 로그인 섹션 */}
                <div style={{ background: 'white', padding: '40px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px', color: 'var(--foreground)' }}>농가 서비스 시작하기</h1>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={handleKakaoLogin} 
                            disabled={loading}
                            style={{ background: '#FEE500', color: '#000', padding: '14px 24px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                            {loading ? (
                                <>잠시만 기다려주세요...</>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000"><path d="M12 3c-5.52 0-10 3.58-10 8 0 2.85 1.83 5.34 4.57 6.74-.29 1.09-1.07 4.12-1.11 4.3-.06.27.14.3.29.2.14-.08 3.51-2.43 4.88-3.38.45.06.91.09 1.38.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" /></svg>
                                    카카오로 1초 시작
                                </>
                            )}
                        </button>
                    </div>
                </div>


            </div>
        </div>
    );
}
