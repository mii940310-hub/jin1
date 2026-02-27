'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const sendResetEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth`,
        });



        if (error) {
            setMsg({ type: 'error', text: `전송 실패: ${error.message}` });
            setLoading(false);
            return;
        }

        setMsg({ type: 'success', text: "비밀번호 재설정 메일을 보냈어요. 메일함을 확인하세요!" });
        setLoading(false);
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '450px' }}>
                <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>비밀번호 찾기</h1>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '32px' }}>
                        가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
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

                    <form onSubmit={sendResetEmail} style={{ display: 'grid', gap: '16px' }}>
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />

                        <button className="btn-primary" disabled={loading} style={{ padding: '14px', marginTop: '12px' }}>
                            {loading ? '처리 중...' : '재설정 메일 보내기'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <Link href="/login" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                            로그인으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
