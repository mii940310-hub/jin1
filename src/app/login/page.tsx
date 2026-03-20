'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            setMsg({ type: 'success', text: '로그인 성공! 이동 중...' });
            router.push(redirectUrl);
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            setMsg({ type: 'success', text: '인증 메일을 확인해주세요!' });
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '450px' }}>
                <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>반갑습니다!</h1>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '32px' }}>Highland Fresh 계정으로 시작하세요.</p>

                    {msg.text && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
                            color: msg.type === 'error' ? '#b91c1c' : '#166534'
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'grid', gap: '16px' }}>
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />

                        <button className="btn-primary" disabled={loading} style={{ padding: '14px', marginTop: '12px' }}>
                            {loading ? '처리 중...' : '로그인'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            style={{ padding: '12px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, borderRadius: '8px' }}
                        >
                            이메일로 회원가입
                        </button>

                        <div style={{ textAlign: 'right' }}>
                            <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'underline' }}>
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        또는 소셜 계정으로 로그인
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'kakao',
                                options: {
                                    redirectTo: `${window.location.origin}/`,
                                    scopes: 'profile_nickname',
                                },
                            });
                            if (error) {
                                setMsg({ type: 'error', text: error.message });
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            marginTop: '16px',
                            backgroundColor: '#FEE500',
                            color: '#000000 85%',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                            <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.85 1.83 5.34 4.57 6.74-.29 1.09-1.07 4.12-1.11 4.3-.06.27.14.3.29.2.14-.08 3.51-2.43 4.88-3.38.45.06.91.09 1.38.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                        </svg>
                        카카오 로그인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ paddingTop: '150px', textAlign: 'center' }}>로딩 중...</div>}>
            <LoginContent />
        </Suspense>
    );
}
