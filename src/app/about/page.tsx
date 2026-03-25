'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div style={{ background: '#fafcfa', minHeight: '100vh', overflow: 'hidden' }}>
            
            {/* 1. Hero Section */}
            <section style={{ 
                position: 'relative', 
                padding: '160px 20px 100px', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px',
                    background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px',
                    background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(100px)'
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ 
                        fontSize: '3.5rem', 
                        fontWeight: 900, 
                        lineHeight: '1.2', 
                        marginBottom: '24px',
                        letterSpacing: '-1px',
                        textShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        농가와 소비자를 잇는<br/>가장 똑똑한 다리, 슝팜
                    </h1>
                    <p style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 400, 
                        opacity: 0.9, 
                        lineHeight: '1.6',
                        marginBottom: '40px'
                    }}>
                        슝팜은 '최저가 경쟁'으로 농가의 고혈을 짜내는 대신,<br/>
                        AI 기술로 농가의 수고를 덜고, 소비자에게는 가장 투명하고 정직한 먹거리를 제공합니다.
                    </p>
                    <button 
                        onClick={() => router.push('/products')}
                        style={{
                            padding: '16px 40px',
                            background: 'white',
                            color: '#059669',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            border: 'none',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.15)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
                    >
                        산지직송 상품 둘러보기
                    </button>
                </div>
            </section>

            {/* 2. Philosophy / Problem Space */}
            <section style={{ padding: '100px 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>왜 슝팜인가요?</h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b' }}>유통 마진의 거품과 맹목적인 최저가 경쟁 속에서, 우리는 '가치'를 찾았습니다.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <PhilosophyCard 
                        icon="📉"
                        title="최저가 경쟁의 종말"
                        desc="플랫폼들이 내세우는 '최저가'는 결국 농민들의 마진 삭감으로 이어집니다. 슝팜은 출혈 경쟁을 멈추고 제값을 보장합니다."
                    />
                    <PhilosophyCard 
                        icon="🧑‍🌾"
                        title="농가 친화적 AI"
                        desc="온라인 판매에 서툰 농부들도 AI의 도움으로 상품 설명을 매력적으로 쓰고, 적정 가격을 쉽게 산출할 수 있습니다."
                    />
                    <PhilosophyCard 
                        icon="🤝"
                        title="투명한 신뢰 구조"
                        desc="소비자는 물류비, 포장비, 수수료, 그리고 농가 수취액이 어떻게 나뉘는지 투명한 원가 분석을 보며 안심하고 구매할 수 있습니다."
                    />
                </div>
            </section>

            {/* 3. Core AI Features */}
            <section style={{ background: 'white', padding: '100px 20px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '40px', textAlign: 'center' }}>
                        슝팜의 핵심 AI 기술
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <AIFeatureRow 
                            emoji="📝"
                            title="AI 구매력 강화 상세 설명"
                            desc="간단한 상품 정보만 입력하면, AI가 소비자 언어에 맞춰 매력적인 타이틀과 스토리, 보관 가이드까지 완벽한 판매 페이지를 대신 작성합니다."
                        />
                        <AIFeatureRow 
                            emoji="💡"
                            title="AI 내부 원가 기반 추천가"
                            desc="외부의 무리한 시세 비교를 배제하고, 농가가 받아야 할 정당한 마진과 부대 비용을 철저히 계산해 농가와 소비자 모두 만족하는 가격을 제안합니다."
                        />
                        <AIFeatureRow 
                            emoji="📦"
                            title="AI 규격 표준화 시스템"
                            desc="크기, 무게 표기가 제각각이라 발생하는 소비자 클레임을 방지하기 위해, 농산물의 규격과 권장 소비 인원을 AI가 명확하게 표준화하여 표기합니다."
                        />
                    </div>
                </div>
            </section>

            {/* 4. CTA (Call To Action) */}
            <section style={{ padding: '100px 20px', textAlign: 'center', background: '#ecfdf5' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#065f46', marginBottom: '24px' }}>
                    지금 정직한 산지직송을 경험하세요
                </h2>
                <p style={{ fontSize: '1.2rem', color: '#166534', marginBottom: '40px' }}>
                    생산자의 땀방울이 온전한 가치를 인정받는 혁신에 동참해 주세요.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => router.push('/products')}
                        style={{ padding: '16px 32px', background: '#10b981', color: 'white', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', transition: '0.2s' }}
                    >
                        농산물 쇼핑하기
                    </button>
                    <button 
                        onClick={() => router.push('/farmer')}
                        style={{ padding: '16px 32px', background: 'white', color: '#10b981', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', border: '2px solid #10b981', cursor: 'pointer', transition: '0.2s' }}
                    >
                        농가 입점하기
                    </button>
                </div>
            </section>
        </div>
    );
}

// Sub-components
function PhilosophyCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div style={{
            background: 'white',
            padding: '40px 30px',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            transition: 'transform 0.3s ease, boxShadow 0.3s ease',
            border: '1px solid #f8fafc',
            cursor: 'default'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)' }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.04)' }}
        >
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{icon}</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>{title}</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '1rem' }}>{desc}</p>
        </div>
    );
}

function AIFeatureRow({ emoji, title, desc }: { emoji: string, title: string, desc: string }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '24px',
            padding: '30px',
            background: '#f8fafc',
            borderRadius: '20px',
            border: '1px solid #e2e8f0'
        }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '20px', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0
            }}>
                {emoji}
            </div>
            <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#334155', marginBottom: '12px' }}>{title}</h3>
                <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>{desc}</p>
            </div>
        </div>
    );
}
