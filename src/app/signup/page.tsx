'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

type MessageState = {
    text: string;
    type: '' | 'error' | 'success';
};

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<MessageState>({ type: '', text: '' });

    const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                },
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: data.user.id,
                        email: formData.email,
                        full_name: formData.fullName,
                        role: 'consumer',
                    },
                ]);

                if (profileError) {
                    throw profileError;
                }
            }

            setMessage({ type: 'success', text: '회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.' });
            setTimeout(() => router.push('/login'), 3000);
        } catch (caughtError) {
            const text = caughtError instanceof Error ? caughtError.message : '회원가입 중 오류가 발생했습니다.';
            setMessage({ type: 'error', text });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '450px' }}>
                <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>회원가입</h1>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '32px' }}>
                        새 계정을 만들고 서비스를 시작해 보세요.
                    </p>

                    {message.text ? (
                        <div
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                fontSize: '0.9rem',
                                background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                                color: message.type === 'error' ? '#b91c1c' : '#166534',
                            }}
                        >
                            {message.text}
                        </div>
                    ) : null}

                    <form onSubmit={handleSignup} style={{ display: 'grid', gap: '16px' }}>
                        <input
                            type="text"
                            placeholder="이름"
                            value={formData.fullName}
                            onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={formData.email}
                            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 (6자 이상)"
                            value={formData.password}
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />

                        <button className="btn-primary" disabled={loading} style={{ padding: '14px', marginTop: '12px' }}>
                            {loading ? '처리 중입니다...' : '회원가입'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        이미 계정이 있나요? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>로그인</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
