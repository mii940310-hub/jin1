'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    }
                }
            });

            if (error) throw error;

            // Create profile
            if (data.user) {
                const { error: profileError } = await supabase.from('profiles').insert([
                    { id: data.user.id, email: formData.email, full_name: formData.fullName, role: 'consumer' }
                ]);
                if (profileError) throw profileError;
            }

            setMsg({ type: 'success', text: '회원가입이 완료되었습니다! 이메일 인증 후 로그인해주세요.' });
            setTimeout(() => router.push('/login'), 3000);
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
                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>회원가입</h1>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '32px' }}>Highland Fresh의 회원이 되어보세요.</p>

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

                    <form onSubmit={handleSignup} style={{ display: 'grid', gap: '16px' }}>
                        <input
                            type="text"
                            placeholder="이름"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 (6자 이상)"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />

                        <button className="btn-primary" disabled={loading} style={{ padding: '14px', marginTop: '12px' }}>
                            {loading ? '처리 중...' : '회원가입'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        이미 계정이 있으신가요? <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>로그인</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
