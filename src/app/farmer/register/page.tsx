'use client';

import { useState, useEffect } from 'react';
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
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check if they already have a farm
                const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();
                if (farm) {
                    router.push('/farmer');
                    return;
                }
                setSessionUser(user);
            }
            setCheckingSession(false);
        };
        checkAuth();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            if (sessionUser) {
                // Already logged in (e.g. Kakao) -> Update profile and create farm directly
                const { error: profileError } = await supabase.from('profiles').update({ role: 'farmer', full_name: formData.farmName }).eq('id', sessionUser.id);
                if (profileError) throw profileError;

                const { error: farmError } = await supabase.from('farms').insert({
                    owner_id: sessionUser.id,
                    name: formData.farmName,
                    address: formData.address,
                    description: formData.description,
                    status: 'pending'
                });
                if (farmError) throw farmError;

                setIsSuccess(true);
            } else {
                // Not logged in -> Sign up new user
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
                setIsSuccess(true);
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
            setLoading(false);
        }
    };

    if (checkingSession) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>인증 정보를 확인하는 중입니다...</div>;
    }

    if (isSuccess) {
        return (
            <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px', display: 'flex', justifyContent: 'center' }}>
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div style={{ background: 'white', padding: '48px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🧑‍🌾</div>
                        <h1 style={{ fontSize: '2.25rem', marginBottom: '16px' }}>농가 신청이 완료되었습니다!</h1>
                        <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                            {sessionUser 
                                ? "농가 등록이 성공적으로 접수되었습니다. 관리자 승인 후 즉시 상품 등록이 가능합니다."
                                : <span>입력하신 이메일(<strong>{formData.email}</strong>)로 인증 메일을 보냈습니다.<br />메일함의 링크를 클릭하여 인증을 완료하시면<br />농가 파트너 시스템을 이용하실 수 있습니다.</span>
                            }
                        </p>
                        <button className="btn-primary" onClick={() => router.push(sessionUser ? '/farmer' : '/login')} style={{ padding: '16px 32px' }}>
                            {sessionUser ? '농가 홈으로 가기' : '로그인 페이지로 가기'}
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
                        {!sessionUser && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>이메일 계정</label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="로그인용 이메일" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>비밀번호</label>
                                    <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="6자 이상 입력" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                </div>
                            </>
                        )}

                        <div style={!sessionUser ? { borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' } : {}}>
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

                    {!sessionUser && (
                        <>
                            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                                <span>또는 소셜 계정으로 1초만에 시작하기</span>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    setLoading(true);
                                    const { error } = await supabase.auth.signInWithOAuth({
                                        provider: 'kakao',
                                        options: {
                                            redirectTo: `${window.location.origin}/farmer/register`,
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
                                    padding: '16px',
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
                                    fontSize: '1.1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                                    <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.85 1.83 5.34 4.57 6.74-.29 1.09-1.07 4.12-1.11 4.3-.06.27.14.3.29.2.14-.08 3.51-2.43 4.88-3.38.45.06.91.09 1.38.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                                </svg>
                                카카오로 간단 로그인 / 회원가입
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
