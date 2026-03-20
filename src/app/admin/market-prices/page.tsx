'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface MarketSummary {
    id: string;
    product_keyword: string;
    category: string;
    avg_market_price: number;
    recommended_price: number;
    price_sources: Record<string, number>;
    updated_at: string;
}

export default function MarketPricesPage() {
    const [summaries, setSummaries] = useState<MarketSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [lastUpdateMsg, setLastUpdateMsg] = useState('');

    const fetchSummaries = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('market_price_summary')
            .select('*')
            .order('updated_at', { ascending: false });
        setSummaries(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSummaries();
    }, [fetchSummaries]);

    const handleManualUpdate = async () => {
        setUpdating(true);
        setLastUpdateMsg('');
        try {
            const res = await fetch('/api/market/update-prices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer jin1-cron-secret-2024',
                },
            });
            const result = await res.json();
            if (result.success) {
                const successCount = result.results.filter((r: any) => r.status === '성공').length;
                setLastUpdateMsg(`✅ ${successCount}개 상품 가격 업데이트 완료 (${new Date().toLocaleString('ko-KR')})`);
                await fetchSummaries();
            } else {
                setLastUpdateMsg('❌ 업데이트 중 오류가 발생했습니다.');
            }
        } catch (e: any) {
            setLastUpdateMsg(`❌ 오류: ${e.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });

    const categoryLabel = (c: string) => c === 'vegetable' ? '🥬 채소' : '🌾 곡물';

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
                            🛒 마트 가격 비교 관리
                        </h1>
                        <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                            네이버쇼핑·이마트·쿠팡 가격을 자동 수집하여 <strong>평균의 30% 할인가</strong>를 상품 추천가로 적용합니다.
                        </p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                            ⏰ 매일 오전 6시 자동 업데이트 | 수동 업데이트도 가능
                        </p>
                    </div>
                    <button
                        onClick={handleManualUpdate}
                        disabled={updating}
                        style={{
                            background: updating
                                ? '#e5e7eb'
                                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: updating ? '#9ca3af' : 'white',
                            border: 'none',
                            padding: '14px 28px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: updating ? 'not-allowed' : 'pointer',
                            boxShadow: updating ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {updating ? (
                            <>⏳ 가격 수집 중...</>
                        ) : (
                            <>🔄 지금 가격 업데이트</>
                        )}
                    </button>
                </header>

                {lastUpdateMsg && (
                    <div style={{
                        padding: '14px 20px',
                        borderRadius: '10px',
                        background: lastUpdateMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${lastUpdateMsg.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`,
                        color: lastUpdateMsg.startsWith('✅') ? '#065f46' : '#991b1b',
                        fontWeight: 600,
                        marginBottom: '24px',
                    }}>
                        {lastUpdateMsg}
                    </div>
                )}

                {/* 안내 카드 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }}>
                    {[
                        { label: '수집 출처', value: '네이버쇼핑 / 이마트 / 쿠팡', icon: '🏪' },
                        { label: '할인율', value: '마트 평균가 대비 30%↓', icon: '💰' },
                        { label: '무게 제한', value: '박스당 최대 10kg', icon: '📦' },
                        { label: '업데이트 주기', value: '매일 1회 (오전 6시)', icon: '⏰' },
                    ].map(card => (
                        <div key={card.label} style={{
                            background: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{card.icon}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>{card.label}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* 가격 테이블 */}
                <section style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                            현재 가격 데이터 ({summaries.length}개 품목)
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                            데이터를 불러오는 중...
                        </div>
                    ) : summaries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                            <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
                                아직 수집된 가격 데이터가 없습니다.
                            </p>
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                                위의 <strong>지금 가격 업데이트</strong> 버튼을 눌러 가격을 수집하세요.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                        {['품목', '카테고리', '네이버쇼핑', '이마트', '쿠팡', '마트 평균가', '30% 할인 추천가', '최종 업데이트'].map(h => (
                                            <th key={h} style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                color: 'var(--muted)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaries.map((s, i) => (
                                        <tr key={s.id} style={{
                                            borderBottom: '1px solid var(--border)',
                                            background: i % 2 === 0 ? 'white' : '#fafafa',
                                        }}>
                                            <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                                                {s.product_keyword}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    background: s.category === 'vegetable' ? '#dcfce7' : '#fef9c3',
                                                    color: s.category === 'vegetable' ? '#166534' : '#854d0e',
                                                    padding: '2px 8px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}>
                                                    {categoryLabel(s.category)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>
                                                {s.price_sources?.['네이버쇼핑'] ? `${s.price_sources['네이버쇼핑'].toLocaleString()}원` : '-'}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>
                                                {s.price_sources?.['이마트'] ? `${s.price_sources['이마트'].toLocaleString()}원` : '-'}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>
                                                {s.price_sources?.['쿠팡'] ? `${s.price_sources['쿠팡'].toLocaleString()}원` : '-'}
                                            </td>
                                            <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                                                {s.avg_market_price.toLocaleString()}원
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    fontWeight: 800,
                                                    color: '#059669',
                                                    fontSize: '1.05rem',
                                                }}>
                                                    {s.recommended_price.toLocaleString()}원
                                                </span>
                                                <span style={{
                                                    marginLeft: '6px',
                                                    background: '#dcfce7',
                                                    color: '#166534',
                                                    padding: '1px 6px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                }}>
                                                    30%↓
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                                {formatTime(s.updated_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* 설명 */}
                <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: '#fffbeb',
                    borderRadius: '12px',
                    border: '1px solid #fde68a',
                    fontSize: '0.9rem',
                    color: '#92400e',
                    lineHeight: 1.7,
                }}>
                    <strong>📌 가격 수집 방식 안내</strong><br />
                    네이버 쇼핑 Open API를 통해 이마트·쿠팡·네이버쇼핑의 가격을 자동 수집합니다.<br />
                    수집된 각 출처의 평균가를 다시 평균 내어 <strong>마트 평균가</strong>를 산정하고, 여기서 <strong>30% 할인한 가격</strong>이 상품 등록 시 AI 추천가의 기준이 됩니다.<br />
                    ※ 이마트/쿠팡 공식 API가 없어 네이버 쇼핑 내 입점몰 기준으로 수집됩니다.
                </div>
            </div>
        </div>
    );
}
