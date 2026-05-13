'use client';

import { type ChangeEvent, type CSSProperties, type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type MessageState = {
    text: string;
    type: '' | 'error' | 'success';
};

type FarmerRegisterForm = {
    address: string;
    description: string;
    email: string;
    farmName: string;
    password: string;
};

const initialForm: FarmerRegisterForm = {
    farmName: '',
    address: '',
    description: '',
    email: '',
    password: '',
};

export default function FarmerRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<FarmerRegisterForm>(initialForm);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [message, setMessage] = useState<MessageState>({ type: '', text: '' });
    const [sessionUser, setSessionUser] = useState<User | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    return;
                }

                const { data: existingFarm } = await supabase
                    .from('farms')
                    .select('id')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (existingFarm) {
                    router.replace('/farmer');
                    return;
                }

                setSessionUser(user);
            } finally {
                setCheckingSession(false);
            }
        };

        void checkSession();
    }, [router]);

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleKakaoStart = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/farmer/register`,
                scopes: 'profile_nickname',
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
        }
    };

    const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (sessionUser) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.farmName,
                        role: 'farmer',
                    })
                    .eq('id', sessionUser.id);

                if (profileError) {
                    throw profileError;
                }

                const { error: farmError } = await supabase.from('farms').insert({
                    address: formData.address,
                    description: formData.description,
                    name: formData.farmName,
                    owner_id: sessionUser.id,
                    status: 'pending',
                });

                if (farmError) {
                    throw farmError;
                }

                setIsSuccess(true);
                return;
            }

            const { error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        farm_address: formData.address,
                        farm_description: formData.description,
                        full_name: formData.farmName,
                        role: 'farmer',
                    },
                },
            });

            if (authError) {
                throw authError;
            }

            setIsSuccess(true);
        } catch (caughtError) {
            const text = caughtError instanceof Error ? caughtError.message : '농가 등록 중 오류가 발생했습니다.';
            setMessage({ type: 'error', text });
            setLoading(false);
        }
    };

    if (checkingSession) {
        return <div style={loadingViewStyle}>로그인 상태를 확인하고 있습니다...</div>;
    }

    if (isSuccess) {
        return (
            <div className="fade-in" style={pageStyle}>
                <div className="container" style={{ maxWidth: 640 }}>
                    <section style={cardStyle}>
                        <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>접수 완료</div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 16 }}>농가 등록 요청이 완료되었습니다.</h1>
                        <p style={descriptionStyle}>
                            {sessionUser ? (
                                '관리자 확인 후 바로 판매를 시작할 수 있습니다. 확인 전에도 기본 화면은 확인할 수 있습니다.'
                            ) : (
                                <>
                                    입력한 이메일로 인증 메일을 보냈습니다.
                                    <br />
                                    메일 인증 후 로그인하면 농가 센터를 사용할 수 있습니다.
                                </>
                            )}
                        </p>
                        <button className="btn-primary" onClick={() => router.push(sessionUser ? '/farmer' : '/login')} style={{ padding: '16px 28px' }} type="button">
                            {sessionUser ? '농가 센터로 이동' : '로그인하러 가기'}
                        </button>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={pageStyle}>
            <div className="container" style={{ maxWidth: 640 }}>
                <section style={cardStyle}>
                    <h1 style={{ fontSize: '2.3rem', fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>농가 센터 등록</h1>
                    <p style={{ ...descriptionStyle, textAlign: 'center', marginBottom: 36 }}>
                        복잡한 설정 없이 농가 정보만 입력하면 판매 준비를 시작할 수 있습니다.
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

                    <form onSubmit={handleRegister} style={{ display: 'grid', gap: 20 }}>
                        {!sessionUser ? (
                            <>
                                <div>
                                    <label htmlFor="email" style={labelStyle}>이메일 계정</label>
                                    <input id="email" name="email" onChange={handleChange} placeholder="로그인에 사용할 이메일" required style={inputStyle} type="email" value={formData.email} />
                                </div>
                                <div>
                                    <label htmlFor="password" style={labelStyle}>비밀번호</label>
                                    <input id="password" name="password" onChange={handleChange} placeholder="6자 이상 입력" required style={inputStyle} type="password" value={formData.password} />
                                </div>
                            </>
                        ) : null}

                        <div style={!sessionUser ? sectionDividerStyle : undefined}>
                            <label htmlFor="farmName" style={labelStyle}>농장명 또는 상호명</label>
                            <input id="farmName" name="farmName" onChange={handleChange} placeholder="예: 햇살감자농장" required style={inputStyle} type="text" value={formData.farmName} />
                        </div>

                        <div>
                            <label htmlFor="address" style={labelStyle}>농장 주소</label>
                            <input id="address" name="address" onChange={handleChange} placeholder="예: 강원도 평창군 ..." required style={inputStyle} type="text" value={formData.address} />
                        </div>

                        <div>
                            <label htmlFor="description" style={labelStyle}>농장 소개</label>
                            <textarea id="description" name="description" onChange={handleChange} placeholder="주요 작물, 수확 방식, 농장 특징을 편하게 적어 주세요." style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={formData.description} />
                        </div>

                        <button className="btn-primary" disabled={loading} style={{ fontSize: '1.08rem', marginTop: 8, padding: '16px 18px' }} type="submit">
                            {loading ? '등록 중입니다...' : '농가 센터 요청하기'}
                        </button>
                    </form>

                    {!sessionUser ? (
                        <>
                            <div style={oauthDividerStyle}>
                                <hr style={dividerLineStyle} />
                                <span>또는 카카오 계정으로 시작하기</span>
                                <hr style={dividerLineStyle} />
                            </div>

                            <button disabled={loading} onClick={() => void handleKakaoStart()} style={kakaoButtonStyle} type="button">
                                카카오로 간편 시작
                            </button>
                        </>
                    ) : null}
                </section>
            </div>
        </div>
    );
}

const pageStyle: CSSProperties = {
    paddingBottom: '100px',
    paddingTop: '120px',
};

const loadingViewStyle: CSSProperties = {
    paddingTop: '150px',
    textAlign: 'center',
};

const cardStyle: CSSProperties = {
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-lg)',
    padding: '48px',
};

const descriptionStyle: CSSProperties = {
    color: 'var(--muted)',
    lineHeight: 1.7,
};

const messageBoxStyle: CSSProperties = {
    borderRadius: 10,
    fontSize: '0.95rem',
    marginBottom: 24,
    padding: '16px',
};

const sectionDividerStyle: CSSProperties = {
    borderTop: '1px solid var(--border)',
    marginTop: 8,
    paddingTop: 20,
};

const oauthDividerStyle: CSSProperties = {
    alignItems: 'center',
    color: 'var(--muted)',
    display: 'flex',
    fontSize: '0.9rem',
    gap: 8,
    justifyContent: 'center',
    marginTop: 24,
};

const dividerLineStyle: CSSProperties = {
    border: 'none',
    borderTop: '1px solid var(--border)',
    flex: 1,
};

const kakaoButtonStyle: CSSProperties = {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    border: 'none',
    borderRadius: 8,
    color: '#111111',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '1.05rem',
    fontWeight: 700,
    justifyContent: 'center',
    marginTop: 16,
    padding: '16px',
    width: '100%',
};

const labelStyle: CSSProperties = {
    display: 'block',
    fontWeight: 700,
    marginBottom: 8,
};

const inputStyle: CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px',
    width: '100%',
};
