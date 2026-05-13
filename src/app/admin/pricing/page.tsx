'use client';

import Link from 'next/link';

export default function AdminPricingDashboard() {
    return (
        <div className="fade-in" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px', paddingTop: '100px' }}>
            <div className="container" style={{ maxWidth: '920px' }}>
                <header style={{ marginBottom: '32px' }}>
                    <h1 style={{ color: '#1e293b', fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>가격 운영 원칙</h1>
                    <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.7 }}>
                        가격이 흔들리거나 근거 설명이 부족한 상태에서는 숫자를 보여주지 않는 것이 맞다고 판단했습니다.
                        현재는 농가 입력가와 물류비, 수수료처럼 검증 가능한 기준만 운영합니다.
                    </p>
                </header>

                <section
                    style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                        marginBottom: '24px',
                        padding: '32px',
                    }}
                >
                    <h2 style={{ color: '#0f172a', fontSize: '1.35rem', fontWeight: 800, marginBottom: '16px' }}>왜 내렸는가</h2>
                    <div style={{ color: '#475569', display: 'grid', gap: '12px', lineHeight: 1.7 }}>
                        <p style={{ margin: 0 }}>같은 상품이라도 결과가 달라질 수 있는 상태에서는 참고 숫자조차 신뢰를 깨뜨릴 수 있습니다.</p>
                        <p style={{ margin: 0 }}>가격은 설명 문구보다 훨씬 민감해서, 한 번 흔들리면 전체 시스템 신뢰까지 같이 무너집니다.</p>
                        <p style={{ margin: 0 }}>그래서 지금은 “그럴듯함”보다 “예측 가능함”을 우선했습니다.</p>
                    </div>
                </section>

                <section
                    style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                        marginBottom: '24px',
                        padding: '32px',
                    }}
                >
                    <h2 style={{ color: '#0f172a', fontSize: '1.35rem', fontWeight: 800, marginBottom: '16px' }}>현재 운영 원칙</h2>
                    <ul style={{ color: '#475569', lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
                        <li>농가가 입력한 가격을 기본으로 사용합니다.</li>
                        <li>물류비와 수수료는 고정 규칙으로 계산합니다.</li>
                        <li>근거를 설명할 수 없는 숫자는 화면에 노출하지 않습니다.</li>
                    </ul>
                </section>

                <section
                    style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '16px',
                        padding: '28px 32px',
                    }}
                >
                    <h2 style={{ color: '#065f46', fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>다시 살릴 조건</h2>
                    <p style={{ color: '#166534', lineHeight: 1.7, margin: '0 0 20px' }}>
                        같은 입력이면 항상 같은 결과가 나오고, 왜 그 가격이 나왔는지 한 줄로 설명할 수 있을 때만 다시 공개하는 것이 맞습니다.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <Link className="btn-primary" href="/admin/fees" style={{ padding: '12px 18px' }}>
                            수수료 관리로 이동
                        </Link>
                        <Link className="btn-outline" href="/admin" style={{ padding: '12px 18px' }}>
                            관리자 메인으로 돌아가기
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
