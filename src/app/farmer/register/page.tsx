'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function FarmerRegisterPage() {
    const [formData, setFormData] = useState({
        farmName: '',
        address: '',
        description: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // Sign up user with farm metadata
            const { error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.farmName,
                        role: 'farmer',
                        farm_address: formData.address,
                        farm_description: formData.description
                    }
                }
            });

            if (authError) throw authError;

            // Success!
            setIsSuccess(true);
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px', display: 'flex', justifyContent: 'center' }}>
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✉️</div>
                        <h1 style={{ fontSize: '2.25rem', marginBottom: '16px' }}>신청이 완료되었습니다!</h1>
                        <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                            입력하신 이메일(<strong>{formData.email}</strong>)로 인증 메일을 보냈습니다.<br />
                            메일함의 링크를 클릭하여 인증을 완료하시면 <br />
                            농가 파트너 시스템을 바로 이용하실 수 있습니다.
                        </p>
                        <button className="btn-primary" onClick={() => router.push('/login')} style={{ padding: '16px 32px' }}>
                            로그인 페이지로 가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
                <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '8px', textAlign: 'center' }}>농가 파트너 등록</h1>
                    <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '40px' }}>
                        강원도 고랭지의 신선함을 소비자에게 직접 전달하세요.
                    </p>

                    {msg.text && (
                        <div style={{
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
                            color: msg.type === 'error' ? '#b91c1c' : '#166534',
                            fontSize: '0.95rem'
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleRegister} style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>이메일 계정</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="로그인용 이메일" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>비밀번호</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="6자 이상 입력" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>농장/상호명</label>
                            <input type="text" name="farmName" required value={formData.farmName} onChange={handleChange} placeholder="예: 정선 정암산농장" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>농장 주소</label>
                            <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="강원도 정선군 화암면..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>농장 소개 (간략히)</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="농장에서 재배하는 품목과 철학을 적어주세요." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '100px' }} />
                        </div>

                        <button className="btn-primary" disabled={loading} style={{ padding: '16px', fontSize: '1.1rem', marginTop: '12px' }}>
                            {loading ? '등록 중...' : '농가 파트너 신청하기'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
