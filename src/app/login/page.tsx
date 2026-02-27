'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const router = useRouter();

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
            router.push('/');
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
                        Google 로그인은 Supabase 설정이 필요합니다.
                    </div>
                </div>
            </div>
        </div>
    );
}
