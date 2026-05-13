'use client';

import { useEffect, useState } from 'react';
import { getMissingEnvs } from '@/lib/env-check';
import { supabase } from '@/lib/supabase';

type DebugResult = {
    details: unknown;
    status: 'SUCCESS' | 'FAILURE';
    test: string;
    time: string;
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : '알 수 없는 오류';
}

export default function DebugPage() {
    const [results, setResults] = useState<DebugResult[]>([]);
    const [missingEnvs, setMissingEnvs] = useState<string[]>([]);

    useEffect(() => {
        setMissingEnvs(getMissingEnvs());
    }, []);

    const addResult = (test: string, status: DebugResult['status'], details: unknown) => {
        setResults((previous) => [
            { details, status, test, time: new Date().toLocaleTimeString() },
            ...previous,
        ]);
    };

    const testSupabase = async () => {
        try {
            const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
            if (error) {
                throw error;
            }
            addResult('Supabase Connection', 'SUCCESS', `Connected. Total products: ${count ?? 0}`);
        } catch (error: unknown) {
            addResult('Supabase Connection', 'FAILURE', getErrorMessage(error));
        }
    };

    const testFetchProducts = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*').limit(5);
            if (error) {
                throw error;
            }
            addResult('Fetch Products', 'SUCCESS', data);
        } catch (error: unknown) {
            addResult('Fetch Products', 'FAILURE', getErrorMessage(error));
        }
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '100px', paddingTop: '120px' }}>
            <div className="container">
                <h1>Debug Test Console</h1>
                <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
                    System status and connectivity tests.
                </p>

                <div style={{ display: 'grid', gap: '40px', gridTemplateColumns: '1fr 2fr' }}>
                    <div>
                        <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius)', marginBottom: '24px', padding: '24px' }}>
                            <h3 style={{ marginBottom: '16px' }}>환경 변수 상태</h3>
                            {missingEnvs.length > 0 ? (
                                <ul style={{ color: '#e63946', fontSize: '0.9rem' }}>
                                    {missingEnvs.map((envName) => <li key={envName}>{envName} 누락</li>)}
                                </ul>
                            ) : (
                                <p style={{ color: '#10b981', fontWeight: 600 }}>모든 필수 환경 변수가 설정되었습니다.</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn-primary" onClick={() => void testSupabase()} type="button">
                                Supabase 연결 테스트
                            </button>
                            <button className="btn-primary" onClick={() => void testFetchProducts()} type="button">
                                상품 조회 테스트
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => addResult('Pricing Policy', 'SUCCESS', '가격은 농가 입력가, 물류비, 수수료 같은 확인 가능한 기준으로 운영합니다.')}
                                type="button"
                            >
                                가격 정책 확인
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => addResult('Cart Test', 'FAILURE', 'Authentication required for cart tests.')}
                                type="button"
                            >
                                장바구니 테스트
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#1e1e1e', borderRadius: 'var(--radius)', color: '#00ff00', fontFamily: 'monospace', height: '600px', overflowY: 'auto', padding: '24px' }}>
                        <h3 style={{ borderBottom: '1px solid #333', color: 'white', marginBottom: '16px', paddingBottom: '8px' }}>Execution Logs</h3>
                        {results.length === 0 ? <p style={{ color: '#666' }}>No tests run yet...</p> : null}
                        {results.map((result, index) => (
                            <div key={`${result.time}-${index}`} style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: '#888' }}>[{result.time}]</span>
                                    <span style={{ color: result.status === 'SUCCESS' ? '#00ff00' : '#ff4444', fontWeight: 700 }}>{result.status}</span>
                                    <span style={{ color: 'white' }}>{result.test}</span>
                                </div>
                                <pre style={{ color: '#aaa', marginLeft: '16px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(result.details, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
