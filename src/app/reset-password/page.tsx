'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const router = useRouter();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setMsg({ type: 'error', text: `변경 실패: ${error.message}` });
            setLoading(false);
            return;
        }

        setMsg({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다! 로그인 페이지로 이동합니다...' });
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '450px' }}>
                <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>비밀번호 재설정</h1>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '32px' }}>
                        새로운 비밀번호를 입력해주세요.
                    </p>

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

                    <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '16px' }}>
                        <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />

                        <button className="btn-primary" disabled={loading} style={{ padding: '14px', marginTop: '12px' }}>
                            {loading ? '변경 중...' : '비밀번호 변경하기'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
