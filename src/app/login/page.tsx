'use client';

import Link from 'next/link';
import { Suspense, type CSSProperties, type FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthRedirectUrl } from '@/lib/site-url';
import { supabase } from '@/lib/supabase';

type MessageState = {
    text: string;
    type: '' | 'error' | 'success';
};

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<MessageState>({ type: '', text: '' });

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                throw error;
            }

            setMessage({ type: 'success', text: '로그인되었습니다. 이동 중입니다...' });
            router.push(redirectUrl);
        } catch (caughtError) {
            const text = caughtError instanceof Error ? caughtError.message : '로그인 중 오류가 발생했습니다.';
            setMessage({ type: 'error', text });
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase.auth.signUp({ email, password });

            if (error) {
                throw error;
            }

            setMessage({ type: 'success', text: '가입 확인 메일을 보냈습니다. 메일을 확인해 주세요.' });
        } catch (caughtError) {
            const text = caughtError instanceof Error ? caughtError.message : '회원가입 요청 중 오류가 발생했습니다.';
            setMessage({ type: 'error', text });
        } finally {
            setLoading(false);
        }
    };

    const handleKakaoLogin = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: getAuthRedirectUrl(redirectUrl),
                scopes: 'profile_nickname',
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={pageStyle}>
            <div className="container" style={{ maxWidth: 450 }}>
                <section style={cardStyle}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 8, textAlign: 'center' }}>로그인</h1>
                    <p style={{ color: 'var(--muted)', marginBottom: 32, textAlign: 'center' }}>
                        계정으로 서비스를 시작해 보세요.
                    </p>

                    {message.text ? (
                        <div
                            style={{
                                ...messageBoxStyle,
                                background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                                color: message.type === 'error' ? '#b91c1c' : '#166534',
                            }}
                        >
                            {message.text}
                        </div>
                    ) : null}

                    <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
                        <input
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="이메일 주소"
                            required
                            style={inputStyle}
                            type="email"
                            value={email}
                        />
                        <input
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="비밀번호"
                            required
                            style={inputStyle}
                            type="password"
                            value={password}
                        />

                        <button className="btn-primary" disabled={loading} style={{ marginTop: 12, padding: 14 }} type="submit">
                            {loading ? '처리 중입니다...' : '로그인'}
                        </button>

                        <button
                            disabled={loading}
                            onClick={() => void handleSignUp()}
                            style={secondaryButtonStyle}
                            type="button"
                        >
                            이메일로 회원가입
                        </button>

                        <div style={{ textAlign: 'right' }}>
                            <Link href="/forgot-password" style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </form>

                    <div style={oauthLabelStyle}>또는 카카오 계정으로 로그인</div>

                    <button disabled={loading} onClick={() => void handleKakaoLogin()} style={kakaoButtonStyle} type="button">
                        카카오로 로그인
                    </button>
                </section>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ paddingTop: '150px', textAlign: 'center' }}>로딩 중입니다...</div>}>
            <LoginContent />
        </Suspense>
    );
}

const pageStyle: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minHeight: '80vh',
    paddingTop: '120px',
};

const cardStyle: CSSProperties = {
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-lg)',
    padding: 48,
};

const messageBoxStyle: CSSProperties = {
    borderRadius: 8,
    fontSize: '0.9rem',
    marginBottom: 20,
    padding: 12,
};

const inputStyle: CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 12,
};

const secondaryButtonStyle: CSSProperties = {
    border: '1px solid var(--primary)',
    borderRadius: 8,
    color: 'var(--primary)',
    fontWeight: 600,
    padding: 12,
};

const oauthLabelStyle: CSSProperties = {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    marginTop: 24,
    textAlign: 'center',
};

const kakaoButtonStyle: CSSProperties = {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    border: 'none',
    borderRadius: 8,
    color: '#111111',
    cursor: 'pointer',
    display: 'flex',
    fontWeight: 700,
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    padding: 14,
    width: '100%',
};
