'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>총괄 관리자 대시보드</h1>
                    <p style={{ color: 'var(--muted)' }}>플랫폼 전체 현황 및 기능을 관리합니다.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <DashboardCard 
                        title="👥 회원 및 농가 관리" 
                        desc="전체 플랫폼 사용자 관리, 농가 가입 신청 승인 및 반려" 
                        link="/admin/users" 
                        icon="👩‍🌾" 
                    />
                    <DashboardCard 
                        title="📦 전체 주문 모니터링" 
                        desc="모든 거래 내역, 주문 상태 및 배송 상황 실시간 조회" 
                        link="/admin/orders" 
                        icon="🚚" 
                    />
                    <DashboardCard 
                        title="💰 플랫폼 수수료 관리" 
                        desc="기본 수수료율 설정 및 상품별 수수료 일괄/개별 조정" 
                        link="/admin/fees" 
                        icon="📈" 
                    />
                    <DashboardCard 
                        title="🛒 가격 검수 센터" 
                        desc="내부 물류비 및 수취액 기준 산지직송 등록 상품 가격의 적정성 검토" 
                        link="/admin/pricing" 
                        icon="💹" 
                    />
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ title, desc, link, icon }: any) {
    return (
        <Link href={link} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '32px',
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
            }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '24px' }}>{icon}</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--foreground)' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>{desc}</p>
                <div style={{ marginTop: '24px', fontWeight: 600, color: 'var(--primary)' }}>
                    관리하기 →
                </div>
            </div>
        </Link>
    );
}
